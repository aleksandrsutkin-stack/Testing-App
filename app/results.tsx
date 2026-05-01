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

import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TrendingUp, TrendingDown, Minus, Lock } from 'lucide-react-native';
import { AppButton } from '../src/components/AppButton';
import { Card } from '../src/components/Card';
import { MetricBar } from '../src/components/MetricBar';
import { PaywallModal } from '../src/components/PaywallModal';
import { scoreAssessment } from '../src/features/assessment/scoreAssessment';
import { createAssessmentSession } from '../src/features/assessment/assembleAssessment';
import { AssessmentResult, ResponseMap, TestId } from '../src/features/assessment/types';
import { makeSessionSeed } from '../src/features/generation/seededRandom';
import { createShareAndDeletePdf } from '../src/services/pdfReportService';
import {
  appendHistory, computeScoreLift, getSettings,
  ScoreLift, HistoryEntry
} from '../src/services/historyService';
import { isUnlocked } from '../src/services/paywallService';
import { scheduleDay7Reminder, cancelDay7Reminder } from '../src/services/notificationService';
import { BRAND } from '../src/config/brand';
import { useColors, ColorPalette } from '../src/theme/colors';
import { useDomainColor, useBandStyle, BandStyle } from '../src/theme/domainColors';
import { spacing } from '../src/theme/spacing';

function firstParam(value: string | string[] | undefined, fallback: string): string {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

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

  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('score');
  const [scoreLift, setScoreLift] = useState<ScoreLift>({ hasPrevious: false });
  const [historySaved, setHistorySaved] = useState(false);

  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  const result = useMemo<AssessmentResult | null>(() => {
    try {
      const responses: ResponseMap = JSON.parse(responsesJson);
      const fullSession = createAssessmentSession({ testId, age, grade, seed });
      const questions = sampleSize ? fullSession.questions.slice(0, sampleSize) : fullSession.questions;
      return scoreAssessment({ profile: { testId, age, grade }, questions, responses, seed });
    } catch {
      return null;
    }
  }, [testId, age, grade, seed, responsesJson, sampleSize]);

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

  async function handleRetake() {
    await cancelDay7Reminder(testId);
    const newSeed = makeSessionSeed(testId, age, grade);
    router.replace({
      pathname: '/assessment',
      params: { testId, age: String(age), grade: String(grade), seed: newSeed }
    });
  }

  function handleTabPress(tab: TabKey) {
    if ((tab === 'mistakes' || tab === 'plan') && !unlocked) {
      setPaywallVisible(true);
      return;
    }
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

      {/* ── COVER STRIP — ScoreLift Score is the lead ────────────────── */}
      <View style={styles.coverStrip}>
        <Text style={styles.coverKicker}>
          {BRAND.appName} · {BRAND.scoreReportName}
          {isQuickStart ? '  ·  SAMPLE' : ''}
        </Text>
        <Text style={styles.coverTitle}>{result.testTitle}</Text>

        {/* Lead score tile */}
        <View style={styles.leadTile}>
          <Text style={styles.leadLabel}>{BRAND.productScoreName}  ·  1–100</Text>
          <Text style={styles.leadValue}>{result.scoreLiftScore}</Text>
          <Text style={styles.leadSub}>{result.scoreLiftScoreLabel}  ·  50 = on grade level</Text>
        </View>

        {/* Two secondary tiles */}
        <View style={styles.metricRow}>
          <View style={styles.metricTile}>
            <Text style={styles.metricLabel}>Percent correct</Text>
            <Text style={styles.metricValue}>{pct}%</Text>
            <Text style={styles.metricSub}>{result.rawScore}/{result.maxScore} questions</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricLabel}>Est. percentile</Text>
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
          <Card style={[styles.summaryCard, { borderLeftColor: band.accent, backgroundColor: band.bg }]}>
            <Text style={[styles.summaryText, { color: band.text }]}>{result.summary}</Text>
          </Card>
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
      {activeTab === 'mistakes' && unlocked ? (
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
      ) : null}

      {/* ── PLAN TAB ──────────────────────────────────────────────── */}
      {activeTab === 'plan' && unlocked ? (
        <View>
          <Text style={styles.tabIntro}>{result.retakeRecommendation}</Text>
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
      ) : null}

      {/* ── ACTIONS ───────────────────────────────────────────────── */}
      <View style={styles.actionArea}>
        <AppButton
          title={
            isQuickStart ? 'Take a real 25-question test' :
            unlocked ? (exported ? 'PDF shared ✓' : 'Export ScoreLift PDF') :
            'Unlock to export PDF'
          }
          onPress={isQuickStart ? () => router.replace('/select') : handleExport}
          loading={exporting}
          disabled={exported}
        />
        {!isQuickStart ? (
          <AppButton title="Retake with new numbers" variant="secondary" onPress={handleRetake} />
        ) : null}
        <AppButton title="Choose a different test" variant="ghost" onPress={() => router.replace('/select')} />
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

// ── TabButton sub-component ─────────────────────────────────────────────────

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

    metricRow: { flexDirection: 'row', gap: 8 },
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

    footerCard: { backgroundColor: colors.surfaceMuted, borderRadius: 14, padding: 14, gap: 6, marginBottom: 8 },
    footerTitle: { color: colors.ink, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.06, marginTop: 6 },
    footerText: { color: colors.inkMuted, fontSize: 12, lineHeight: 18 },

    errorCard: { gap: 14, marginTop: 40 },
    errorTitle: { color: colors.ink, fontSize: 22, fontWeight: '700' },
    muted: { color: colors.inkMuted, lineHeight: 22, marginBottom: 4 }
  });
}
