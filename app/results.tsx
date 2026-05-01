// app/results.tsx
//
// v0.6 — major rewrite:
//   - ScoreLift Score (1–100) is the lead headline tile (was: percentile).
//   - Percentile tile cites the benchmark source (e.g. "vs. NWEA MAP").
//   - Removed all questionLiftIndex / productIndexName references.
//   - Full dark mode via useColors() + useDomainColor() + useBandStyle() hooks
//     and makeStyles(colors) factory pattern.
//   - All hardcoded color literals (#FFF7ED, #166534, etc.) replaced with
//     theme-aware band styles.
//
// Cover layout:
//   ┌───────────────────────────────────────────────┐
//   │  KICKER · TEST TITLE                          │
//   │                                               │
//   │  ┌─────────────────────────────┐ ┌─────┐ ┌──┐│
//   │  │ ScoreLift Score · 1–100     │ │ Pct │ │%t││  ← lead tile, 36px
//   │  │       72                     │ │ 78% │ │70-│ │
//   │  │   Above grade                 │ │ ... │ │80 │ │
//   │  └─────────────────────────────┘ └─────┘ └──┘│
//   └───────────────────────────────────────────────┘

import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { TrendingUp, TrendingDown, Minus, Lock, Share2 } from 'lucide-react-native';
import { AppButton } from '../src/components/AppButton';
import { Card } from '../src/components/Card';
import { MetricBar } from '../src/components/MetricBar';
import { PaywallModal } from '../src/components/PaywallModal';
import { ScoreCard } from '../src/components/ScoreCard';
import { scoreAssessment } from '../src/features/assessment/scoreAssessment';
import { createAssessmentSession } from '../src/features/assessment/assembleAssessment';
import {
  AssessmentResult, CONFIDENCE_LABELS, PriorityFix, ResponseMap, TestId
} from '../src/features/assessment/types';
import { BAND_HEADLINES } from '../src/features/assessment/domainLabels';
import { makeSessionSeed } from '../src/features/generation/seededRandom';
import { createShareAndDeletePdf } from '../src/services/pdfReportService';
import { shareScoreCard } from '../src/services/scoreCardService';
import {
  appendHistory, computeScoreLift, getSettings,
  ScoreLift, HistoryEntry
} from '../src/services/historyService';
import { isUnlocked } from '../src/services/paywallService';
import { scheduleDay7Reminder, cancelDay7Reminder } from '../src/services/notificationService';
import { setTrackHistory } from '../src/services/historyService';
import { BRAND } from '../src/config/brand';
import { useColors, ColorPalette } from '../src/theme/colors';
import { useDomainColor, useBandStyle, BandStyle } from '../src/theme/domainColors';
import { spacing } from '../src/theme/spacing';

function firstParam(value: string | string[] | undefined, fallback: string): string {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

// v0.9: AsyncStorage key for the 7-day throttle on the history-on prompt.
const HISTORY_PROMPT_KEY = 'qlft:history-prompt-shown:v1';

type TabKey = 'score' | 'mistakes' | 'plan';

export default function ResultsScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const domainColorOf = useDomainColor();
  const bandStyleOf = useBandStyle();

  const params = useLocalSearchParams();
  const testId = firstParam(params.testId, 'quizlift-aptitude-snapshot') as TestId;
  const age = Number(firstParam(params.age, '10'));
  const grade = Number(firstParam(params.grade, '5'));
  const seed = firstParam(params.seed, '');
  const responsesJson = firstParam(params.responses, '{}');
  const sampleSizeRaw = firstParam(params.sampleSize, '');
  const sampleSize = sampleSizeRaw ? Number(sampleSizeRaw) : 0;
  const isQuickStart = sampleSize > 0;
  // v0.9: Optional session-only "Prepared for" name from the test setup screen.
  // Empty string → undefined so the PDF cover line is fully omitted.
  const preparedForRaw = firstParam(params.preparedFor, '');
  const preparedFor = preparedForRaw.trim() || undefined;

  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('score');
  const [scoreLift, setScoreLift] = useState<ScoreLift>({ hasPrevious: false });
  const [historySaved, setHistorySaved] = useState(false);

  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  // v0.8: Share Score card export (image, free, even when locked).
  const scoreCardRef = useRef<View>(null);
  const [sharingCard, setSharingCard] = useState(false);
  const [cardShared, setCardShared] = useState(false);

  // v0.9: One-time history-on prompt (after retake, when history is off).
  const [historyPromptVisible, setHistoryPromptVisible] = useState(false);

  const result = useMemo<AssessmentResult | null>(() => {
    try {
      const responses: ResponseMap = JSON.parse(responsesJson);
      const fullSession = createAssessmentSession({ testId, age, grade, seed });
      const questions = sampleSize ? fullSession.questions.slice(0, sampleSize) : fullSession.questions;
      return scoreAssessment({
        profile: { testId, age, grade, preparedFor },
        questions, responses, seed
      });
    } catch {
      return null;
    }
  }, [testId, age, grade, seed, responsesJson, sampleSize, preparedFor]);

  useEffect(() => {
    if (isQuickStart) { setUnlocked(true); return; }
    isUnlocked(testId).then(setUnlocked);
  }, [testId, isQuickStart]);

  useEffect(() => {
    if (!result || historySaved) return;
    let cancelled = false;

    (async () => {
      const settings = await getSettings();
      if (!settings.trackHistory) {
        setHistorySaved(true);
        return;
      }

      // v0.6: scoreLiftScore (1–100) replaces questionLiftIndex (70–130).
      const lift = await computeScoreLift(testId, result.percent, result.scoreLiftScore);
      if (cancelled) return;
      setScoreLift(lift);

      const entry: HistoryEntry = {
        testId: result.testId, testTitle: result.testTitle,
        percent: result.percent, rawScore: result.rawScore, maxScore: result.maxScore,
        scoreLiftScore: result.scoreLiftScore, readinessBand: result.readinessBand,
        completedAtIso: result.completedAtIso
      };
      await appendHistory(entry);

      if (!isQuickStart) {
        await scheduleDay7Reminder(result.testId, result.testTitle);
      }

      if (!cancelled) setHistorySaved(true);
    })();

    return () => { cancelled = true; };
  }, [result, historySaved, testId, isQuickStart]);

  async function handleExport() {
    if (!result) return;
    if (!unlocked) { setPaywallVisible(true); return; }
    setExporting(true);
    try {
      await createShareAndDeletePdf(result);
      setExported(true);
    } catch (e) {
      console.warn('PDF export failed', e);
    } finally {
      setExporting(false);
    }
  }

  // v0.8: Share Score card. Free, always allowed — this is the viral hook.
  async function handleShareScore() {
    setSharingCard(true);
    try {
      const result = await shareScoreCard(scoreCardRef);
      if (result.shared) setCardShared(true);
    } finally {
      setSharingCard(false);
    }
  }

  // v0.9: history-on prompt logic. Throttled to once per 7 days locally.
  // Only shown when (a) the user just completed a retake-style session
  // (i.e. not quick-start), (b) history is currently off, and (c) the
  // throttle key hasn't been touched within the last 7 days.
  useEffect(() => {
    if (isQuickStart || !result) return;
    let cancelled = false;
    (async () => {
      try {
        const settings = await getSettings();
        if (settings.trackHistory) return;
        const lastShownRaw = await AsyncStorage.getItem(HISTORY_PROMPT_KEY);
        const lastShown = lastShownRaw ? Number(lastShownRaw) : 0;
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - lastShown < sevenDaysMs) return;
        if (!cancelled) setHistoryPromptVisible(true);
      } catch {
        // Non-fatal — just don't show the prompt.
      }
    })();
    return () => { cancelled = true; };
  }, [isQuickStart, result]);

  async function enableHistoryFromPrompt() {
    try {
      await setTrackHistory(true);
      await AsyncStorage.setItem(HISTORY_PROMPT_KEY, String(Date.now()));
    } finally {
      setHistoryPromptVisible(false);
    }
  }

  async function dismissHistoryPrompt() {
    try {
      await AsyncStorage.setItem(HISTORY_PROMPT_KEY, String(Date.now()));
    } finally {
      setHistoryPromptVisible(false);
    }
  }

  async function handleRetake() {
    await cancelDay7Reminder(testId);
    const newSeed = makeSessionSeed(testId, age, grade);
    router.replace({
      pathname: '/assessment',
      params: { testId, age: String(age), grade: String(grade), seed: newSeed }
    });
  }

  function handleTabPress(tab: TabKey) {
    // v0.8: Allow free users to switch into Mistakes/Plan tabs and see a
    // blurred teaser. The unlock CTA is shown over the blurred content.
    setActiveTab(tab);
  }

  async function handlePurchased() {
    setPaywallVisible(false);
    setUnlocked(true);
  }

  if (!result) {
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.errorCard}>
          <Text style={styles.errorTitle}>Could not score this session</Text>
          <Text style={styles.muted}>Answers or session data may be missing.</Text>
          <AppButton title="Back to test menu" onPress={() => router.replace('/select')} />
        </Card>
      </ScrollView>
    );
  }

  const pct = Math.round(result.percent * 100);
  const band = bandStyleOf(result.readinessBand);
  const wellAboveBand = bandStyleOf('well-above');
  const belowBand = bandStyleOf('below');

  // Short benchmark name for the percentile tile (e.g. "NWEA MAP grade math norms" → "NWEA MAP")
  const benchmarkShort = (() => {
    const s = result.percentileEstimate.benchmarkSource ?? '';
    if (s.includes('NWEA MAP')) return 'NWEA MAP';
    if (s.includes('IAAT') || s.includes('Iowa Algebra')) return 'IAAT';
    if (s.includes('DAT-5') || s.includes('Differential Aptitude')) return 'DAT-5';
    if (s.includes('BRACKEN')) return 'BRACKEN-3';
    if (s.includes('AFQT') || s.includes('ASVAB')) return 'ASVAB AFQT';
    return s.split(' ').slice(0, 3).join(' ') || 'Public norm';
  })();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* ── COVER STRIP — v0.9: band headline leads, score is supporting ─── */}
      <View style={styles.coverStrip}>
        <Text style={styles.coverKicker}>
          {BRAND.appName} · {BRAND.scoreReportName}
          {isQuickStart ? '  ·  SAMPLE' : ''}
        </Text>

        {/* Band headline + icon as the visual lead */}
        <Text style={styles.bandHeadline}>
          {BAND_HEADLINES[result.readinessBand].headline}{' '}
          <Text style={styles.bandIcon}>{BAND_HEADLINES[result.readinessBand].icon}</Text>
        </Text>

        {/* Supporting line: score / 100 + test/grade */}
        <Text style={styles.coverScoreLine}>
          {BRAND.productScoreName}: {result.scoreLiftScore} / 100
        </Text>
        <Text style={styles.coverMetaLine}>
          {result.testTitle}{result.grade >= 0 ? `  ·  Grade ${result.grade}` : ''}
        </Text>
        {preparedFor ? (
          <Text style={styles.coverPreparedFor}>Prepared for {preparedFor}</Text>
        ) : null}

        {/* Inline retake delta — only when history has a previous attempt */}
        {scoreLift.hasPrevious ? (
          <View style={styles.coverDeltaWrap}>
            <DeltaPill liftScore={scoreLift.liftScore ?? 0} />
          </View>
        ) : null}

        {/* Two secondary tiles */}
        <View style={styles.metricRow}>
          <View style={styles.metricTile}>
            <Text style={styles.metricLabel}>Percent correct</Text>
            <Text style={styles.metricValue}>{pct}%</Text>
            <Text style={styles.metricSub}>{result.rawScore}/{result.maxScore} questions</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricLabel}>Benchmark range</Text>
            <Text style={styles.metricValue}>{result.percentileEstimate.rangeLabel}</Text>
            <Text style={styles.metricSub}>vs. {benchmarkShort}</Text>
          </View>
        </View>
      </View>

      {/* ── SCORE LIFT (history-only) ──────────────────────────────── */}
      {scoreLift.hasPrevious ? <ScoreLiftCard lift={scoreLift} currentPct={pct} colors={colors} /> : null}

      {/* ── TABS ─────────────────────────────────────────────────── */}
      <View style={styles.tabRow}>
        <TabButton label="Score" tabKey="score" active={activeTab} onPress={handleTabPress} colors={colors} />
        <TabButton
          label={`Mistakes${result.missedQuestions.length > 0 ? ` (${result.missedQuestions.length})` : ''}`}
          tabKey="mistakes"
          active={activeTab}
          onPress={handleTabPress}
          locked={!unlocked}
          colors={colors}
        />
        <TabButton label="Plan" tabKey="plan" active={activeTab} onPress={handleTabPress} locked={!unlocked} colors={colors} />
      </View>

      {/* ── SCORE TAB ─────────────────────────────────────────────── */}
      {activeTab === 'score' ? (
        <View>
          {/* v0.9: Parent summary at the top of the Score tab — first thing read. */}
          <Card style={styles.parentSummaryCard}>
            <Text style={styles.parentSummaryEyebrow}>Parent summary</Text>
            <Text style={styles.parentSummaryText}>{result.parentSummary}</Text>
          </Card>

          <Card style={[styles.summaryCard, { borderLeftColor: band.accent, backgroundColor: band.bg }]}>
            <Text style={[styles.summaryText, { color: band.text }]}>{result.summary}</Text>
          </Card>

          {/* v0.9: Confidence pill — honest signal of screening weight. */}
          <View style={styles.confidenceWrap}>
            <View style={styles.confidencePill}>
              <Text style={styles.confidenceIcon}>ⓘ</Text>
              <Text style={styles.confidencePillText}>{CONFIDENCE_LABELS[result.screeningConfidence].short}</Text>
            </View>
            <Text style={styles.confidenceLong}>{CONFIDENCE_LABELS[result.screeningConfidence].long}</Text>
          </View>

          <Text style={styles.caveat}>{result.percentileEstimate.caveat}</Text>

          <Text style={styles.sectionTitle}>Domain ratings</Text>
          <Card style={styles.domainCard}>
            {result.domainScores.map(score => (
              <MetricBar
                key={score.domain}
                label={score.label}
                percent={score.percent * 100}
                caption={`${score.rawScore}/${score.maxScore} · ${score.band.replace(/-/g, ' ')}`}
                color={domainColorOf(score.domain)}
              />
            ))}
          </Card>

          <View style={styles.twoCol}>
            <Card style={[styles.twoColCard, { backgroundColor: wellAboveBand.bg, borderColor: wellAboveBand.border }]}>
              <Text style={[styles.twoColTitle, { color: wellAboveBand.text }]}>Strengths</Text>
              {result.strengths.map(s => <Text key={s} style={[styles.listItem, { color: wellAboveBand.text }]}>• {s}</Text>)}
            </Card>
            <Card style={[styles.twoColCard, { backgroundColor: belowBand.bg, borderColor: belowBand.border }]}>
              <Text style={[styles.twoColTitle, { color: belowBand.text }]}>Growth areas</Text>
              {result.growthAreas.map(s => <Text key={s} style={[styles.listItem, { color: belowBand.text }]}>• {s}</Text>)}
            </Card>
          </View>

          {!unlocked ? (
            <Pressable onPress={() => setPaywallVisible(true)} style={styles.upsellCard}>
              <Lock size={18} color="#FFFFFF" strokeWidth={2.4} />
              <View style={{ flex: 1 }}>
                <Text style={styles.upsellTitle}>
                  See why you missed {result.missedQuestions.length} question{result.missedQuestions.length === 1 ? '' : 's'}
                </Text>
                <Text style={styles.upsellSub}>Step solutions, common traps, 7-day plan, PDF export.</Text>
              </View>
              <Text style={styles.upsellArrow}>›</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* ── MISTAKES TAB ──────────────────────────────────────────── */}
      {activeTab === 'mistakes' ? (
        <TeaserOverlay
          locked={!unlocked}
          colors={colors}
          onUnlock={() => setPaywallVisible(true)}
          headline="Unlock your full ScoreLift Report"
          subhead="See every mistake explained step-by-step"
        >
        <View>
          {result.missedQuestions.length === 0 ? (
            <Card style={[styles.noMissCard, { backgroundColor: wellAboveBand.bg, borderColor: wellAboveBand.border }]}>
              <Text style={[styles.noMissText, { color: wellAboveBand.text }]}>
                No missed questions this session — use the practice plan to keep skills fresh.
              </Text>
            </Card>
          ) : (
            <>
              <Text style={styles.tabIntro}>
                {result.missedQuestions.length} missed question{result.missedQuestions.length > 1 ? 's' : ''} reviewed below.
              </Text>
              {result.missedQuestions.map((miss, i) => {
                const dColor = domainColorOf(miss.domain);
                return (
                  <Card key={miss.questionId} style={styles.missCard}>
                    <Text style={[styles.missEyebrow, { color: dColor }]}>
                      Missed #{i + 1} · {miss.domainLabel} · {miss.mistakeTypeLabel}
                    </Text>
                    <Text style={styles.missPrompt}>{miss.prompt}</Text>
                    <View style={styles.answerRow}>
                      <View style={[styles.answerBox, { backgroundColor: belowBand.bg, borderColor: belowBand.border }]}>
                        <Text style={styles.answerLabel}>Your answer</Text>
                        <Text style={[styles.answerText, { color: belowBand.text }]}>{miss.selectedAnswerLabel}</Text>
                      </View>
                      <View style={[styles.answerBox, { backgroundColor: wellAboveBand.bg, borderColor: wellAboveBand.border }]}>
                        <Text style={styles.answerLabel}>Correct</Text>
                        <Text style={[styles.answerText, { color: wellAboveBand.text }]}>{miss.correctAnswerLabel}</Text>
                      </View>
                    </View>
                    {miss.commonTrap ? (
                      <View style={[styles.trapBox, { backgroundColor: bandStyleOf('on-grade').bg, borderColor: bandStyleOf('on-grade').border }]}>
                        <Text style={[styles.trapLabel, { color: bandStyleOf('on-grade').text }]}>Common trap</Text>
                        <Text style={[styles.trapText, { color: bandStyleOf('on-grade').text }]}>{miss.commonTrap}</Text>
                      </View>
                    ) : null}
                    <Text style={styles.stepsTitle}>Step-by-step solution</Text>
                    {miss.explanationSteps.map((step, si) => (
                      <View key={si} style={styles.stepRow}>
                        <View style={[styles.stepBubble, { backgroundColor: dColor }]}>
                          <Text style={styles.stepNum}>{si + 1}</Text>
                        </View>
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    ))}
                    {miss.practiceLinks.length > 0 ? (
                      <View style={styles.linksBox}>
                        <Text style={styles.linksTitle}>Practice this skill</Text>
                        {miss.practiceLinks.map(link => (
                          <View key={link.url} style={styles.linkRow}>
                            <Text style={styles.linkLabel}>{link.label}</Text>
                            <Text style={styles.linkSub}>{link.reason}</Text>
                            <Text style={styles.linkUrl}>{link.url}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </Card>
                );
              })}
            </>
          )}
        </View>
        </TeaserOverlay>
      ) : null}

      {/* ── PLAN TAB ──────────────────────────────────────────────── */}
      {activeTab === 'plan' ? (
        <TeaserOverlay
          locked={!unlocked}
          colors={colors}
          onUnlock={() => setPaywallVisible(true)}
          headline="Unlock your 7-day ScoreLift plan"
          subhead="Step-by-step practice plan with Khan Academy links"
        >
        <View>
          {/* v0.9: Top 3 priority fixes — most actionable section in the report. */}
          {result.topPriorityFixes.length > 0 ? (
            <>
              <Text style={styles.priorityTitle}>
                Top {result.topPriorityFixes.length === 1 ? '' : `${result.topPriorityFixes.length} `}to fix first
              </Text>
              <Text style={styles.priorityIntro}>
                Ranked by impact: more misses + harder difficulty = higher priority.
              </Text>
              {result.topPriorityFixes.map((fix, i) => (
                <PriorityFixCard key={fix.skillId} fix={fix} index={i} colors={colors} />
              ))}
            </>
          ) : (
            <Card style={[styles.planCard, { backgroundColor: colors.info, borderColor: colors.border }]}>
              <Text style={[styles.planTitle, { color: colors.primaryDark }]}>No priority fixes</Text>
              <Text style={[styles.planReason, { color: colors.primary }]}>
                Strong run on every skill. Use the 7-day plan below to keep skills sharp.
              </Text>
            </Card>
          )}

          <Text style={styles.priorityTitle}>7-day ScoreLift plan</Text>
          <Text style={styles.priorityIntro}>{result.retakeRecommendation}</Text>
          {result.practicePlan.map((assignment, i) => (
            <Card key={assignment.skillId} style={styles.planCard}>
              <Text style={styles.planDay}>Day {i + 1}</Text>
              <Text style={styles.planTitle}>{assignment.title}</Text>
              <Text style={styles.planReason}>{assignment.reason}</Text>
              <Text style={styles.planUrl}>{assignment.url}</Text>
            </Card>
          ))}
          <Card style={[styles.planCard, { backgroundColor: colors.info, borderColor: colors.border }]}>
            <Text style={[styles.planDay, { color: colors.primary }]}>Day 7</Text>
            <Text style={[styles.planTitle, { color: colors.primaryDark }]}>Retake Sprint</Text>
            <Text style={[styles.planReason, { color: colors.primary }]}>
              Same skills and difficulty, fresh numbers and question variants.
            </Text>
          </Card>
        </View>
        </TeaserOverlay>
      ) : null}

      {/* ── ACTIONS ───────────────────────────────────────────────── */}
      <View style={styles.actionArea}>
        {/* v0.8: Share Score is the viral hook — free, prominent, above the PDF CTA. */}
        <AppButton
          title={cardShared ? 'Score shared ✓' : 'Share Score'}
          onPress={handleShareScore}
          loading={sharingCard}
          disabled={cardShared}
          leftIcon={<Share2 size={16} color="#FFFFFF" strokeWidth={2.4} />}
        />

        {/* v0.9: After successful PDF export, surface the action by intent.
             Three buttons all call the same share flow — they just frame it.
             "Send to tutor" is the primary because it's the value framing
             that justifies $2.99. */}
        {exported ? (
          <Card style={styles.postExportCard}>
            <Text style={styles.postExportTitle}>✓ ScoreLift Report ready</Text>
            <AppButton
              title="Send to tutor or teacher  ›"
              onPress={handleExport}
            />
            <AppButton
              title="Save to Files"
              variant="secondary"
              onPress={handleExport}
            />
            <AppButton
              title="Share other way"
              variant="ghost"
              onPress={handleExport}
            />
          </Card>
        ) : (
          <AppButton
            title={
              isQuickStart ? 'Take a real 25-question test' :
              unlocked ? 'Export ScoreLift PDF' :
              'Unlock full report — $2.99'
            }
            variant="secondary"
            onPress={isQuickStart ? () => router.replace('/select') : handleExport}
            loading={exporting}
          />
        )}

        {!isQuickStart ? (
          <AppButton title="Retake with new numbers" variant="ghost" onPress={handleRetake} />
        ) : null}
        <AppButton title="Choose a different test" variant="ghost" onPress={() => router.replace('/select')} />
      </View>

      {/* v0.9: One-time prompt to enable history when the user has just done a
           retake and history is OFF. Throttled to at most once every 7 days. */}
      {historyPromptVisible ? (
        <Card style={styles.historyPromptCard}>
          <Text style={styles.historyPromptTitle}>Track progress over time?</Text>
          <Text style={styles.historyPromptBody}>
            Turn on local-only history (default off, easy to erase). Your child's improvement
            story is the most motivating part of using {BRAND.appName}.
          </Text>
          <View style={styles.historyPromptRow}>
            <AppButton title="Turn on history" onPress={enableHistoryFromPrompt} style={{ flex: 1 }} />
            <AppButton title="Not now" variant="ghost" onPress={dismissHistoryPrompt} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : null}

      {/* v0.8: Off-screen ScoreCard — rendered for capture only. */}
      <View pointerEvents="none" style={styles.offscreen}>
        <ScoreCard
          ref={scoreCardRef}
          scoreLiftScore={result.scoreLiftScore}
          testName={result.testTitle}
          percentileLabel={`Estimated ${result.percentileEstimate.rangeLabel}  ·  ${benchmarkShort}`}
          scoreLabel={result.scoreLiftScoreLabel}
        />
      </View>

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <View style={styles.footerCard}>
        <Text style={styles.footerTitle}>Privacy</Text>
        <Text style={styles.footerText}>{BRAND.privacyPromise}</Text>
        <Text style={styles.footerTitle}>Disclaimer</Text>
        <Text style={styles.footerText}>{result.disclaimer}</Text>
      </View>

      {/* ── PAYWALL MODAL ─────────────────────────────────────────── */}
      <PaywallModal
        visible={paywallVisible}
        testId={testId}
        testTitle={result.testTitle}
        missedCount={result.missedQuestions.length}
        onClose={() => setPaywallVisible(false)}
        onPurchased={handlePurchased}
      />

    </ScrollView>
  );
}

// ── ScoreLiftCard sub-component ─────────────────────────────────────────────

function ScoreLiftCard({ lift, currentPct, colors }: { lift: ScoreLift; currentPct: number; colors: ColorPalette }) {
  if (!lift.hasPrevious) return null;
  const liftPct = lift.liftPercent ?? 0;
  const liftScore = lift.liftScore ?? 0;
  const direction = liftPct > 0 ? 'up' : liftPct < 0 ? 'down' : 'flat';

  // Pull tone from semantic palette colors so dark mode looks right.
  const tone = direction === 'up'
    ? { bg: colors.surface, border: colors.success, text: colors.success, accent: colors.success }
    : direction === 'down'
    ? { bg: colors.surface, border: colors.danger, text: colors.danger, accent: colors.danger }
    : { bg: colors.surface, border: colors.border, text: colors.inkMuted, accent: colors.inkMuted };

  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
  const sign = liftPct > 0 ? '+' : '';
  const scoreSign = liftScore > 0 ? '+' : '';
  const prevPct = Math.round((lift.previousPercent ?? 0) * 100);
  const prevDate = lift.previousDate ? new Date(lift.previousDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

  return (
    <View style={[styles_lift.liftCard, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <View style={styles_lift.liftHead}>
        <View style={[styles_lift.liftIconCircle, { backgroundColor: tone.accent }]}>
          <Icon size={18} color="#FFFFFF" strokeWidth={2.4} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles_lift.liftTitle, { color: tone.text }]}>
            {direction === 'up' ? 'Score lift!' : direction === 'down' ? 'Down from last attempt' : 'Same as last attempt'}
          </Text>
          <Text style={[styles_lift.liftSub, { color: colors.inkMuted }]}>Last attempt {prevDate} · {prevPct}%</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles_lift.liftBigNum, { color: tone.text }]}>{sign}{liftPct}%</Text>
          <Text style={[styles_lift.liftScoreDelta, { color: colors.inkMuted }]}>{scoreSign}{liftScore} ScoreLift</Text>
        </View>
      </View>
      <View style={[styles_lift.liftCompareRow, { borderColor: tone.border }]}>
        <View style={styles_lift.liftCompareSide}>
          <Text style={[styles_lift.liftCompareLabel, { color: colors.inkMuted }]}>Then</Text>
          <Text style={[styles_lift.liftCompareValue, { color: colors.ink }]}>{prevPct}%</Text>
        </View>
        <View style={styles_lift.liftCompareArrow}><Text style={[styles_lift.liftArrow, { color: tone.accent }]}>→</Text></View>
        <View style={styles_lift.liftCompareSide}>
          <Text style={[styles_lift.liftCompareLabel, { color: colors.inkMuted }]}>Now</Text>
          <Text style={[styles_lift.liftCompareValue, { color: colors.ink }]}>{currentPct}%</Text>
        </View>
      </View>
    </View>
  );
}

const styles_lift = StyleSheet.create({
  liftCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 14, gap: 12 },
  liftHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  liftIconCircle: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  liftTitle: { fontSize: 15, fontWeight: '700' },
  liftSub: { fontSize: 12, marginTop: 2 },
  liftBigNum: { fontSize: 22, fontWeight: '700' },
  liftScoreDelta: { fontSize: 11 },
  liftCompareRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingTop: 12, gap: 12 },
  liftCompareSide: { flex: 1, alignItems: 'center', gap: 2 },
  liftCompareLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.05 },
  liftCompareValue: { fontSize: 24, fontWeight: '700' },
  liftCompareArrow: { paddingHorizontal: 8 },
  liftArrow: { fontSize: 24, fontWeight: '700' }
});

// ── DeltaPill — v0.8 inline retake delta ────────────────────────────────────

function DeltaPill({ liftScore }: { liftScore: number }) {
  // The lead tile sits on a dark indigo background, so use light tones for
  // contrast. Positive=success, zero=muted, negative=neutral (NOT red).
  const tone =
    liftScore > 0 ? { color: '#86EFAC', icon: '⬆️', text: `+${liftScore} points from last time` } :
    liftScore < 0 ? { color: '#C7D2FE', icon: '⬇️', text: `${liftScore} points from last time` } :
                    { color: '#C7D2FE', icon: '➡️', text: 'Same score as last time — review your Mistake Map' };
  return (
    <Text style={{ color: tone.color, fontSize: 12, fontWeight: '600', marginTop: 4 }}>
      {tone.icon}  {tone.text}
    </Text>
  );
}

// ── TeaserOverlay — v0.8 paywall blur overlay ───────────────────────────────

function TeaserOverlay({
  locked, colors, onUnlock, headline, subhead, children
}: {
  locked: boolean;
  colors: ColorPalette;
  onUnlock: () => void;
  headline: string;
  subhead: string;
  children: React.ReactNode;
}) {
  if (!locked) return <>{children}</>;
  // v0.8: Real frosted-glass blur via expo-blur. Reduced opacity is kept
  // alongside it so dark-mode (which gives the BlurView a darker tint)
  // still feels obviously "locked" rather than just "dim."
  return (
    <View style={{ position: 'relative' }}>
      <View pointerEvents="none" style={{ opacity: 0.6 }}>{children}</View>
      <BlurView
        intensity={28}
        tint="default"
        pointerEvents="none"
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        alignItems: 'center', justifyContent: 'center', padding: 24
      }}>
        <View style={{
          backgroundColor: colors.surface, borderRadius: 18, padding: 22,
          alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.border,
          shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 6 }, elevation: 6,
          maxWidth: 320
        }}>
          <View style={{
            width: 48, height: 48, borderRadius: 14, backgroundColor: '#4F46E5',
            alignItems: 'center', justifyContent: 'center'
          }}>
            <Lock size={22} color="#FFFFFF" strokeWidth={2.4} />
          </View>
          <Text style={{ color: colors.ink, fontSize: 17, fontWeight: '700', textAlign: 'center' }}>
            {headline}
          </Text>
          <Text style={{ color: colors.inkMuted, fontSize: 13, lineHeight: 19, textAlign: 'center' }}>
            {subhead}
          </Text>
          <Pressable
            onPress={onUnlock}
            style={({ pressed }) => [{
              backgroundColor: '#4F46E5', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12,
              marginTop: 4
            }, pressed && { opacity: 0.85 }]}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>Unlock — $2.99</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ── TabButton sub-component ─────────────────────────────────────────────────

// ── PriorityFixCard sub-component (v0.9) ────────────────────────────────────

function PriorityFixCard({ fix, index, colors }: { fix: PriorityFix; index: number; colors: ColorPalette }) {
  return (
    <View style={{
      flexDirection: 'row', gap: 12, alignItems: 'flex-start',
      backgroundColor: colors.surface,
      borderRadius: 14, padding: 14, marginBottom: 10,
      borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.primary,
    }}>
      <View style={{
        flexShrink: 0, width: 28, height: 28, borderRadius: 14,
        backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700' }}>{index + 1}</Text>
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: colors.ink, fontSize: 14, fontWeight: '700' }}>{fix.skillLabel}</Text>
        <Text style={{
          color: colors.inkMuted, fontSize: 11, fontWeight: '600',
          textTransform: 'uppercase', letterSpacing: 0.05,
        }}>
          {fix.domainLabel}  ·  {fix.missedCount} missed
        </Text>
        <Text style={{ color: colors.ink, fontSize: 13, lineHeight: 19 }}>{fix.rationale}</Text>
        {fix.practiceLink ? (
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', marginTop: 4 }}>
            Practice on {fix.practiceLink.provider} →
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function TabButton({ label, tabKey, active, onPress, locked, colors }: {
  label: string; tabKey: TabKey; active: TabKey; onPress: (k: TabKey) => void; locked?: boolean; colors: ColorPalette;
}) {
  const isActive = active === tabKey;
  return (
    <Pressable
      onPress={() => onPress(tabKey)}
      style={({ pressed }) => [
        { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
        isActive ? { backgroundColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 } : null,
        pressed ? { opacity: 0.85 } : null
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
        {locked ? <Lock size={11} color={colors.inkMuted} strokeWidth={2.4} /> : null}
        <Text style={[
          { color: colors.inkMuted, fontSize: 13, fontWeight: '600' },
          isActive && { color: colors.ink, fontWeight: '700' as const },
          locked && { opacity: 0.85 }
        ]}>{label}</Text>
      </View>
    </Pressable>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

function makeStyles(colors: ColorPalette) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, paddingBottom: spacing.xxl },

    coverStrip: { backgroundColor: '#1E1B4B', borderRadius: 20, padding: 22, marginBottom: 14, gap: 14 },
    coverKicker: { color: '#A5B4FC', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.08 },
    coverTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', lineHeight: 28 },

    leadTile: {
      backgroundColor: 'rgba(255,255,255,0.18)',
      borderRadius: 14,
      padding: 16,
      gap: 4
    },
    leadLabel: { color: '#A5B4FC', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.08 },
    leadValue: { color: '#FFFFFF', fontSize: 36, fontWeight: '700', lineHeight: 40 },
    leadSub: { color: '#C7D2FE', fontSize: 12, fontWeight: '500' },

    // v0.9 cover (band headline lead).
    bandHeadline: { color: '#FFFFFF', fontSize: 36, fontWeight: '700', lineHeight: 40, letterSpacing: -0.01 },
    bandIcon: { fontSize: 32 },
    coverScoreLine: { color: '#E0E7FF', fontSize: 16, fontWeight: '700', marginTop: 8 },
    coverMetaLine: { color: '#C7D2FE', fontSize: 12 },
    coverPreparedFor: { color: '#C7D2FE', fontSize: 11, marginTop: 4 },
    coverDeltaWrap: { marginTop: 4 },

    metricRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
    metricTile: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 12, gap: 3 },
    metricLabel: { color: '#C7D2FE', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.05 },
    metricValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', lineHeight: 26 },
    metricSub: { color: '#C7D2FE', fontSize: 11 },

    tabRow: { flexDirection: 'row', gap: 6, marginBottom: 14, backgroundColor: colors.surfaceMuted, padding: 4, borderRadius: 12 },

    summaryCard: { padding: 16, borderRadius: 14, borderLeftWidth: 4, marginBottom: 8 },
    summaryText: { fontSize: 14, lineHeight: 22, fontWeight: '500' },
    caveat: { color: colors.inkMuted, fontSize: 11, lineHeight: 17, marginBottom: 18, marginHorizontal: 2 },
    sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '700', marginTop: 4, marginBottom: 10 },
    domainCard: { gap: 16, marginBottom: 18 },
    twoCol: { flexDirection: 'row', gap: 10, marginBottom: 18 },
    twoColCard: { flex: 1, padding: 14, borderRadius: 16, gap: 6 },
    twoColTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    listItem: { fontSize: 13, lineHeight: 20, fontWeight: '500' },

    upsellCard: {
      backgroundColor: '#1E1B4B', borderRadius: 16, padding: 16,
      flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18
    },
    upsellTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginBottom: 2 },
    upsellSub: { color: '#C7D2FE', fontSize: 12, lineHeight: 17 },
    upsellArrow: { color: '#FFFFFF', fontSize: 24, fontWeight: '300' },

    tabIntro: { color: colors.inkMuted, fontSize: 13, lineHeight: 20, marginBottom: 12, fontStyle: 'italic' },
    noMissCard: { padding: 18, borderRadius: 14, marginBottom: 14, borderWidth: 1 },
    noMissText: { fontSize: 14, lineHeight: 22, fontWeight: '600', textAlign: 'center' },
    missCard: { gap: 12, marginBottom: 12 },
    missEyebrow: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.06 },
    missPrompt: { color: colors.ink, fontSize: 16, fontWeight: '600', lineHeight: 24 },
    answerRow: { flexDirection: 'row', gap: 8 },
    answerBox: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, gap: 3 },
    answerLabel: { color: colors.inkMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.05 },
    answerText: { fontSize: 13, fontWeight: '600' },
    trapBox: { borderWidth: 1, borderRadius: 10, padding: 10, gap: 3 },
    trapLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.05 },
    trapText: { fontSize: 13, lineHeight: 20 },
    stepsTitle: { color: colors.ink, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.05 },
    stepRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
    stepBubble: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
    stepNum: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
    stepText: { color: colors.ink, fontSize: 13, lineHeight: 21, flex: 1 },
    linksBox: { backgroundColor: colors.info, borderRadius: 10, padding: 10, gap: 8 },
    linksTitle: { color: colors.primaryDark, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.05 },
    linkRow: { gap: 2 },
    linkLabel: { color: colors.primaryDark, fontSize: 13, fontWeight: '600' },
    linkSub: { color: colors.inkMuted, fontSize: 12 },
    linkUrl: { color: colors.primary, fontSize: 12 },

    planCard: { borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 14, marginBottom: 8, gap: 3 },
    planDay: { color: colors.inkMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.06 },
    planTitle: { color: colors.ink, fontSize: 15, fontWeight: '700' },
    planReason: { color: colors.inkMuted, fontSize: 13, lineHeight: 20 },
    planUrl: { color: colors.primary, fontSize: 12 },

    actionArea: { gap: 10, marginTop: 14, marginBottom: 18 },

    // v0.8: ScoreCard render container — positioned outside the visible
    // viewport so we can captureRef() it without showing it on screen.
    // NB: do NOT set opacity:0 here — react-native-view-shot can skip
    // drawing transparent subtrees on some platforms. Off-screen position
    // alone is enough to hide it from users while keeping it capturable.
    offscreen: { position: 'absolute', left: -10000, top: 0 },

    footerCard: { backgroundColor: colors.surfaceMuted, borderRadius: 14, padding: 14, gap: 6, marginBottom: 8 },
    footerTitle: { color: colors.ink, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.06, marginTop: 6 },
    footerText: { color: colors.inkMuted, fontSize: 12, lineHeight: 18 },

    errorCard: { gap: 14, marginTop: 40 },
    errorTitle: { color: colors.ink, fontSize: 22, fontWeight: '700' },
    muted: { color: colors.inkMuted, lineHeight: 22, marginBottom: 4 },

    // ── v0.9 styles ────────────────────────────────────────────────────────
    parentSummaryCard: { gap: 8, marginBottom: 14 },
    parentSummaryEyebrow: {
      color: colors.primary, fontSize: 11, fontWeight: '700',
      textTransform: 'uppercase', letterSpacing: 0.08,
    },
    parentSummaryText: { color: colors.ink, fontSize: 15, lineHeight: 24, fontWeight: '500' },

    confidenceWrap: { gap: 6, marginBottom: 10, alignItems: 'flex-start' },
    confidencePill: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
      backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border,
    },
    confidenceIcon: { color: colors.inkMuted, fontSize: 13 },
    confidencePillText: { color: colors.inkMuted, fontSize: 11, fontWeight: '700' },
    confidenceLong: { color: colors.inkMuted, fontSize: 11, lineHeight: 17, marginHorizontal: 2 },

    priorityTitle: { color: colors.ink, fontSize: 18, fontWeight: '700', marginTop: 6, marginBottom: 4 },
    priorityIntro: { color: colors.inkMuted, fontSize: 13, lineHeight: 19, marginBottom: 12 },

    postExportCard: { gap: 10, marginBottom: 6 },
    postExportTitle: { color: colors.success, fontSize: 14, fontWeight: '700', marginBottom: 2 },

    historyPromptCard: { gap: 8, marginTop: 8, marginBottom: 14 },
    historyPromptTitle: { color: colors.ink, fontSize: 16, fontWeight: '700' },
    historyPromptBody: { color: colors.inkMuted, fontSize: 13, lineHeight: 20 },
    historyPromptRow: { flexDirection: 'row', gap: 10, marginTop: 4 }
  });
}
