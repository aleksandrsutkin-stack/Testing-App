import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TrendingUp, TrendingDown, Minus, Lock } from 'lucide-react-native';
import { AppButton } from '../src/components/AppButton';
import { Card } from '../src/components/Card';
import { MetricBar } from '../src/components/MetricBar';
import { PaywallModal } from '../src/components/PaywallModal';
import { scoreAssessment } from '../src/features/assessment/scoreAssessment';
import { createAssessmentSession, selectBalancedSample } from '../src/features/assessment/assembleAssessment';
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
import { domainColor, bandStyle } from '../src/theme/domainColors';
import { colors } from '../src/theme/colors';
import { spacing } from '../src/theme/spacing';

function firstParam(value: string | string[] | undefined, fallback: string): string {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

type TabKey = 'score' | 'mistakes' | 'plan';

export default function ResultsScreen() {
  const params = useLocalSearchParams();
  const testId = firstParam(params.testId, 'questionliftiq-aptitude-snapshot') as TestId;
  const age = Number(firstParam(params.age, '10'));
  const grade = Number(firstParam(params.grade, '5'));
  const seed = firstParam(params.seed, '');
  const responsesJson = firstParam(params.responses, '{}');
  const sampleSizeRaw = firstParam(params.sampleSize, '');
  const sampleSize = sampleSizeRaw ? Number(sampleSizeRaw) : 0;
  // Quick Start (sampleSize > 0) is always fully unlocked.
  const isQuickStart = sampleSize > 0;

  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('score');
  const [scoreLift, setScoreLift] = useState<ScoreLift>({ hasPrevious: false });
  const [historySaved, setHistorySaved] = useState(false);

  // Paywall state
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [paywallVisible, setPaywallVisible] = useState(false);

  // Score the assessment
  const result = useMemo<AssessmentResult | null>(() => {
    try {
      const responses: ResponseMap = JSON.parse(responsesJson);
      const fullSession = createAssessmentSession({ testId, age, grade, seed });
      const questions = sampleSize ? selectBalancedSample(fullSession.questions, sampleSize) : fullSession.questions;
      return scoreAssessment({ profile: { testId, age, grade }, questions, responses, seed });
    } catch {
      return null;
    }
  }, [testId, age, grade, seed, responsesJson, sampleSize]);

  // Check unlock status whenever the result loads or testId changes.
  useEffect(() => {
    if (isQuickStart) { setUnlocked(true); return; }
    isUnlocked(testId).then(setUnlocked);
  }, [testId, isQuickStart]);

  // Compute score lift, save history, schedule Day 7 reminder
  useEffect(() => {
    if (!result || historySaved) return;
    let cancelled = false;

    (async () => {
      const settings = await getSettings();
      if (!settings.trackHistory) {
        setHistorySaved(true);
        return;
      }

      const lift = await computeScoreLift(testId, result.percent, result.questionLiftIndex, result.completedAtIso);
      if (cancelled) return;
      setScoreLift(lift);

      const entry: HistoryEntry = {
        testId: result.testId, testTitle: result.testTitle,
        percent: result.percent, rawScore: result.rawScore, maxScore: result.maxScore,
        questionLiftIndex: result.questionLiftIndex, readinessBand: result.readinessBand,
        completedAtIso: result.completedAtIso
      };
      await appendHistory(entry);

      // Schedule Day-7 retake reminder. Only fires if history is on and permission granted.
      // Skip for Quick Start samples — they're meant to be one-and-done demos.
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
      await createShareAndDeletePdf(result, scoreLift.hasPrevious ? scoreLift : undefined);
      setExported(true);
      // Privacy-strict v0.5.1 behavior: after the share sheet returns, the
      // temporary PDF has been deleted and we leave the scored session route.
      router.replace('/select');
    } catch (e) {
      console.warn('PDF export failed', e);
    } finally {
      setExporting(false);
    }
  }

  async function handleRetake() {
    // User retook early — cancel any pending Day-7 reminder for this test
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
  const band = bandStyle(result.readinessBand);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

      {/* ── COVER STRIP ────────────────────────────────── */}
      <View style={styles.coverStrip}>
        <Text style={styles.coverKicker}>
          {BRAND.appName} · {BRAND.scoreReportName}
          {isQuickStart ? '  ·  SAMPLE' : ''}
        </Text>
        <Text style={styles.coverTitle}>{result.testTitle}</Text>

        <View style={styles.metricRow}>
          <View style={styles.metricTile}>
            <Text style={styles.metricLabel}>Percent correct</Text>
            <Text style={styles.metricValue}>{pct}%</Text>
            <Text style={styles.metricSub}>{result.rawScore}/{result.maxScore} questions</Text>
          </View>
          <View style={styles.metricTile}>
            <Text style={styles.metricLabel}>Est. percentile</Text>
            <Text style={styles.metricValue}>{result.percentileEstimate.rangeLabel}</Text>
            <Text style={styles.metricSub}>Static estimate</Text>
          </View>
          <View style={[styles.metricTile, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
            <Text style={styles.metricLabel}>{BRAND.productIndexName}</Text>
            <Text style={styles.metricValue}>{result.questionLiftIndex}</Text>
            <Text style={styles.metricSub}>{result.readinessLabel}</Text>
          </View>
        </View>
      </View>

      {/* ── SCORE LIFT ─────────────────────────────────── */}
      {scoreLift.hasPrevious ? <ScoreLiftCard lift={scoreLift} currentPct={pct} /> : null}

      {/* ── TABS ───────────────────────────────────────── */}
      <View style={styles.tabRow}>
        <TabButton label="Score" tabKey="score" active={activeTab} onPress={handleTabPress} />
        <TabButton
          label={`Mistakes${result.missedQuestions.length > 0 ? ` (${result.missedQuestions.length})` : ''}`}
          tabKey="mistakes"
          active={activeTab}
          onPress={handleTabPress}
          locked={!unlocked}
        />
        <TabButton label="Plan" tabKey="plan" active={activeTab} onPress={handleTabPress} locked={!unlocked} />
      </View>

      {/* ── SCORE TAB ──────────────────────────────────── */}
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
                color={domainColor(score.domain)}
              />
            ))}
          </Card>

          <View style={styles.twoCol}>
            <Card style={[styles.twoColCard, { backgroundColor: '#EAF7EE' }]}>
              <Text style={[styles.twoColTitle, { color: '#166534' }]}>Strengths</Text>
              {result.strengths.map(s => <Text key={s} style={[styles.listItem, { color: '#166534' }]}>• {s}</Text>)}
            </Card>
            <Card style={[styles.twoColCard, { backgroundColor: '#FFF7ED' }]}>
              <Text style={[styles.twoColTitle, { color: '#9A3412' }]}>Growth areas</Text>
              {result.growthAreas.map(s => <Text key={s} style={[styles.listItem, { color: '#9A3412' }]}>• {s}</Text>)}
            </Card>
          </View>

          {/* Inline upsell card on the Score tab when locked */}
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

      {/* ── MISTAKES TAB ───────────────────────────────── */}
      {activeTab === 'mistakes' && unlocked ? (
        <View>
          {result.missedQuestions.length === 0 ? (
            <Card style={[styles.noMissCard, { backgroundColor: '#EAF7EE' }]}>
              <Text style={[styles.noMissText, { color: '#166534' }]}>
                No missed questions this session — use the practice plan to keep skills fresh.
              </Text>
            </Card>
          ) : (
            <>
              <Text style={styles.tabIntro}>
                {result.missedQuestions.length} missed question{result.missedQuestions.length > 1 ? 's' : ''} reviewed below.
              </Text>
              {result.missedQuestions.map((miss, i) => {
                const dColor = domainColor(miss.domain);
                return (
                  <Card key={miss.questionId} style={styles.missCard}>
                    <Text style={[styles.missEyebrow, { color: dColor }]}>
                      Missed #{i + 1} · {miss.domainLabel} · {miss.mistakeTypeLabel}
                    </Text>
                    <Text style={styles.missPrompt}>{miss.prompt}</Text>
                    <View style={styles.answerRow}>
                      <View style={[styles.answerBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                        <Text style={styles.answerLabel}>Your answer</Text>
                        <Text style={[styles.answerText, { color: '#7F1D1D' }]}>{miss.selectedAnswerLabel}</Text>
                      </View>
                      <View style={[styles.answerBox, { backgroundColor: '#F0FDF4', borderColor: '#86EFAC' }]}>
                        <Text style={styles.answerLabel}>Correct</Text>
                        <Text style={[styles.answerText, { color: '#166534' }]}>{miss.correctAnswerLabel}</Text>
                      </View>
                    </View>
                    {miss.commonTrap ? (
                      <View style={styles.trapBox}>
                        <Text style={styles.trapLabel}>Common trap</Text>
                        <Text style={styles.trapText}>{miss.commonTrap}</Text>
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

      {/* ── PLAN TAB ───────────────────────────────────── */}
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
          <Card style={[styles.planCard, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}>
            <Text style={[styles.planDay, { color: '#4F46E5' }]}>Day 7</Text>
            <Text style={[styles.planTitle, { color: '#3730A3' }]}>Retake Sprint</Text>
            <Text style={[styles.planReason, { color: '#4F46E5' }]}>
              Same skills and difficulty, fresh numbers and question variants.
            </Text>
          </Card>
        </View>
      ) : null}

      {/* ── ACTIONS ────────────────────────────────────── */}
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

      {/* ── FOOTER ─────────────────────────────────────── */}
      <View style={styles.footerCard}>
        <Text style={styles.footerTitle}>Privacy</Text>
        <Text style={styles.footerText}>{BRAND.privacyPromise}</Text>
        <Text style={styles.footerTitle}>Disclaimer</Text>
        <Text style={styles.footerText}>{result.disclaimer}</Text>
      </View>

      {/* ── PAYWALL MODAL ──────────────────────────────── */}
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

// ── ScoreLiftCard sub-component ─────────────────────────────

function ScoreLiftCard({ lift, currentPct }: { lift: ScoreLift; currentPct: number }) {
  if (!lift.hasPrevious) return null;
  const liftPct = lift.liftPercent ?? 0;
  const liftIdx = lift.liftIndex ?? 0;
  const direction = liftPct > 0 ? 'up' : liftPct < 0 ? 'down' : 'flat';
  const tone = direction === 'up'
    ? { bg: '#ECFDF5', border: '#6EE7B7', text: '#065F46', accent: '#10B981' }
    : direction === 'down'
    ? { bg: '#FEF2F2', border: '#FCA5A5', text: '#991B1B', accent: '#EF4444' }
    : { bg: '#F1F5F9', border: '#CBD5E1', text: '#475569', accent: '#64748B' };

  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;
  const sign = liftPct > 0 ? '+' : '';
  const idxSign = liftIdx > 0 ? '+' : '';
  const prevPct = Math.round((lift.previousPercent ?? 0) * 100);
  const prevDate = lift.previousDate ? new Date(lift.previousDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

  return (
    <View style={[styles.liftCard, { backgroundColor: tone.bg, borderColor: tone.border }]}>
      <View style={styles.liftHead}>
        <View style={[styles.liftIconCircle, { backgroundColor: tone.accent }]}>
          <Icon size={18} color="#FFFFFF" strokeWidth={2.4} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.liftTitle, { color: tone.text }]}>
            {direction === 'up' ? 'Score lift!' : direction === 'down' ? 'Down from last attempt' : 'Same as last attempt'}
          </Text>
          <Text style={[styles.liftSub, { color: tone.text }]}>Last attempt {prevDate} · {prevPct}%</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.liftBigNum, { color: tone.text }]}>{sign}{liftPct}%</Text>
          <Text style={[styles.liftIdx, { color: tone.text }]}>{idxSign}{liftIdx} index</Text>
        </View>
      </View>
      <View style={[styles.liftCompareRow, { borderColor: tone.border }]}>
        <View style={styles.liftCompareSide}>
          <Text style={[styles.liftCompareLabel, { color: tone.text }]}>Then</Text>
          <Text style={[styles.liftCompareValue, { color: tone.text }]}>{prevPct}%</Text>
        </View>
        <View style={styles.liftCompareArrow}><Text style={[styles.liftArrow, { color: tone.accent }]}>→</Text></View>
        <View style={styles.liftCompareSide}>
          <Text style={[styles.liftCompareLabel, { color: tone.text }]}>Now</Text>
          <Text style={[styles.liftCompareValue, { color: tone.text }]}>{currentPct}%</Text>
        </View>
      </View>
    </View>
  );
}

// ── TabButton sub-component ─────────────────────────────────

function TabButton({ label, tabKey, active, onPress, locked }: { label: string; tabKey: TabKey; active: TabKey; onPress: (k: TabKey) => void; locked?: boolean }) {
  const isActive = active === tabKey;
  return (
    <Pressable
      onPress={() => onPress(tabKey)}
      style={({ pressed }) => [styles.tab, isActive && styles.tabActive, pressed && styles.tabPressed]}
    >
      <View style={styles.tabContent}>
        {locked ? <Lock size={11} color={colors.inkMuted} strokeWidth={2.4} /> : null}
        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive, locked && styles.tabLabelLocked]}>{label}</Text>
      </View>
    </Pressable>
  );
}

// ── Styles ─────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },

  coverStrip: { backgroundColor: '#1E1B4B', borderRadius: 20, padding: 22, marginBottom: 14, gap: 10 },
  coverKicker: { color: '#A5B4FC', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.08 },
  coverTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', lineHeight: 28 },
  metricRow: { flexDirection: 'row', gap: 8 },
  metricTile: { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 12, gap: 3 },
  metricLabel: { color: '#C7D2FE', fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.05 },
  metricValue: { color: '#FFFFFF', fontSize: 22, fontWeight: '700', lineHeight: 26 },
  metricSub: { color: '#C7D2FE', fontSize: 11 },

  liftCard: { borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 14, gap: 12 },
  liftHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  liftIconCircle: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  liftTitle: { fontSize: 15, fontWeight: '700' },
  liftSub: { fontSize: 12, opacity: 0.85, marginTop: 2 },
  liftBigNum: { fontSize: 22, fontWeight: '700' },
  liftIdx: { fontSize: 11, opacity: 0.85 },
  liftCompareRow: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, paddingTop: 12, gap: 12 },
  liftCompareSide: { flex: 1, alignItems: 'center', gap: 2 },
  liftCompareLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.05, opacity: 0.7 },
  liftCompareValue: { fontSize: 24, fontWeight: '700' },
  liftCompareArrow: { paddingHorizontal: 8 },
  liftArrow: { fontSize: 24, fontWeight: '700' },

  tabRow: { flexDirection: 'row', gap: 6, marginBottom: 14, backgroundColor: colors.surfaceMuted, padding: 4, borderRadius: 12 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  tabContent: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tabActive: { backgroundColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  tabPressed: { opacity: 0.85 },
  tabLabel: { color: colors.inkMuted, fontSize: 13, fontWeight: '600' },
  tabLabelActive: { color: colors.ink, fontWeight: '700' },
  tabLabelLocked: { opacity: 0.85 },

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
  noMissCard: { padding: 18, borderRadius: 14, marginBottom: 14 },
  noMissText: { fontSize: 14, lineHeight: 22, fontWeight: '600', textAlign: 'center' },
  missCard: { gap: 12, marginBottom: 12 },
  missEyebrow: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.06 },
  missPrompt: { color: colors.ink, fontSize: 16, fontWeight: '600', lineHeight: 24 },
  answerRow: { flexDirection: 'row', gap: 8 },
  answerBox: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, gap: 3 },
  answerLabel: { color: colors.inkMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.05 },
  answerText: { fontSize: 13, fontWeight: '600' },
  trapBox: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderWidth: 1, borderRadius: 10, padding: 10, gap: 3 },
  trapLabel: { color: '#92400E', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.05 },
  trapText: { color: '#78350F', fontSize: 13, lineHeight: 20 },
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
