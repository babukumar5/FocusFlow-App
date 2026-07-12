import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, Text as SvgText } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTimerStore } from '@/src/store/timerStore';
import { computeTodayGraphData, computeWeekGraphData, computeYearGraphData } from '@/src/services/statisticsService';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48; // padding 24 on each side
const CHART_HEIGHT = 290;
const PRIMARY_BLUE = '#1E90FF';

// Animated Path for Chart
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Helper to generate a smooth bezier curve path from data points
const generateSmoothPath = (points: {x: number, y: number}[]) => {
  'worklet';
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;
  
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const midX = (p0.x + p1.x) / 2;
    d += ` C ${midX},${p0.y} ${midX},${p1.y} ${p1.x},${p1.y}`;
  }
  return d;
};

export default function ActivityScreen() {
  const [activeTab, setActiveTab] = useState<'Today' | 'Week' | 'Year'>('Today');
  const { sessions, totalFocusTime: totalTime, totalSessions, avgSessionDuration: avgSession, bestDayTime } = useTimerStore();

  const focusSessions = useMemo(() => sessions.filter(s => s.mode === 'focus'), [sessions]);

  // Chart Data Generation based on activeTab
  const chartData = useMemo(() => {
    let labels: string[] = [];
    let rawData: number[] = [];

    if (activeTab === 'Today') {
      const data = computeTodayGraphData(sessions);
      labels = data.labels;
      rawData = data.values;
    } else if (activeTab === 'Week') {
      const data = computeWeekGraphData(sessions);
      labels = data.labels;
      rawData = data.values;
    } else {
      const data = computeYearGraphData(sessions);
      labels = data.labels;
      rawData = data.values;
    }

    const maxVal = Math.max(...rawData, 1);
    const paddingX = 40;
    const paddingY = 20;
    const usableWidth = CHART_WIDTH - paddingX * 2;
    const usableHeight = CHART_HEIGHT - paddingY * 2;

    const points = rawData.map((val, idx) => ({
      x: paddingX + (idx / (rawData.length - 1)) * usableWidth,
      y: paddingY + usableHeight - (val / maxVal) * usableHeight,
      val
    }));

    const path = generateSmoothPath(points);
    const areaPath = `${path} L ${points[points.length - 1].x},${CHART_HEIGHT} L ${points[0].x},${CHART_HEIGHT} Z`;
    
    // Find highest point for indicator
    let highestPoint = points[0];
    points.forEach(p => {
      if (p.y < highestPoint.y) highestPoint = p;
    });

    return { points, path, areaPath, labels, highestPoint };
  }, [activeTab, focusSessions]);

  // Animation state for path
  const pathAnim = useSharedValue(0);
  const currentPoints = useSharedValue(chartData.points);
  const prevPoints = useSharedValue(chartData.points);

  useEffect(() => {
    prevPoints.value = currentPoints.value;
    currentPoints.value = chartData.points;
    pathAnim.value = 0;
    pathAnim.value = withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) });
  }, [chartData.points]);

  const animatedLineProps = useAnimatedProps(() => {
    const progress = pathAnim.value;
    const cPoints = currentPoints.value;
    const pPoints = prevPoints.value;

    const interpPoints = [];
    const maxLen = Math.max(pPoints.length, cPoints.length);
    for (let i = 0; i < maxLen; i++) {
      const p1 = pPoints[Math.min(i, pPoints.length - 1)];
      const p2 = cPoints[Math.min(i, cPoints.length - 1)];
      interpPoints.push({
        x: p1.x + (p2.x - p1.x) * progress,
        y: p1.y + (p2.y - p1.y) * progress,
      });
    }

    return {
      d: generateSmoothPath(interpPoints),
    };
  });

  const animatedAreaProps = useAnimatedProps(() => {
    const progress = pathAnim.value;
    const cPoints = currentPoints.value;
    const pPoints = prevPoints.value;

    const interpPoints = [];
    const maxLen = Math.max(pPoints.length, cPoints.length);
    for (let i = 0; i < maxLen; i++) {
      const p1 = pPoints[Math.min(i, pPoints.length - 1)];
      const p2 = cPoints[Math.min(i, cPoints.length - 1)];
      interpPoints.push({
        x: p1.x + (p2.x - p1.x) * progress,
        y: p1.y + (p2.y - p1.y) * progress,
      });
    }

    const path = generateSmoothPath(interpPoints);
    if (interpPoints.length === 0) return { d: '' };
    const lastPoint = interpPoints[interpPoints.length - 1];
    const firstPoint = interpPoints[0];
    const areaPath = `${path} L ${lastPoint.x},${CHART_HEIGHT} L ${firstPoint.x},${CHART_HEIGHT} Z`;

    return {
      d: areaPath,
    };
  });

  return (
    <ExpoLinearGradient colors={['#020B2E', '#0A2F73']} style={styles.gradientBg}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Activity</Text>
              <Text style={styles.subtitle}>See your productivity and focus statistics.</Text>
            </View>
          </View>

        {/* Segmented Control */}
        <View style={styles.segmentContainer}>
          {['Today', 'Week', 'Year'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.segmentTab, isActive && styles.segmentTabActive]}
                onPress={() => setActiveTab(tab as any)}
              >
                <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Chart Area */}
        <View style={styles.chartContainer}>
          <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={PRIMARY_BLUE} stopOpacity="0.3" />
                <Stop offset="1" stopColor={PRIMARY_BLUE} stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            {/* Grid Lines & Y Labels */}
            {[0, 1, 2, 3, 4].map((i) => {
              const y = 20 + (i * (CHART_HEIGHT - 40)) / 4;
              const val = (4 - i) * 15;
              return (
                <React.Fragment key={i}>
                  <Line x1="45" y1={y} x2={CHART_WIDTH - 15} y2={y} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" strokeDasharray="4 4" />
                  <SvgText x="15" y={y + 4} fill="#A8C7FF" fontSize="11" fontWeight="500">{val}m</SvgText>
                </React.Fragment>
              );
            })}

            {/* Area Fill */}
            <AnimatedPath animatedProps={animatedAreaProps} fill="url(#chartGrad)" />

            {/* Line Chart */}
            <AnimatedPath animatedProps={animatedLineProps} fill="none" stroke={PRIMARY_BLUE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

            {/* Highest Point Indicator */}
            <Animated.View style={[
                styles.highestIndicator, 
                { left: chartData.highestPoint.x - 6, top: chartData.highestPoint.y - 6, position: 'absolute' }
              ]} 
            />
          </Svg>

          {/* X Axis Labels */}
          <View style={styles.xLabelsContainer}>
            {chartData.labels.map((lbl, idx) => (
              <Text key={idx} style={styles.xLabel}>{lbl}</Text>
            ))}
          </View>
        </View>

        {/* Activity Summary Section */}
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Activity Summary</Text>
          <Text style={styles.summarySubtitle}>This report updates automatically as you complete focus sessions.</Text>
        </View>

        {/* Cards Grid */}
        <View style={styles.cardsGrid}>
          {/* Card 1 */}
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardIconWrapper}>
                <MaterialCommunityIcons name="clock-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.cardNumber}>{Math.floor(totalTime / 60)}h {(totalTime % 60)}m</Text>
            </View>
            <Text style={styles.cardLabel}>Total Focus Time</Text>
          </View>

          {/* Card 2 */}
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardIconWrapper}>
                <MaterialCommunityIcons name="calendar-check" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.cardNumber}>{totalSessions}</Text>
            </View>
            <Text style={styles.cardLabel}>Total Sessions</Text>
          </View>

          {/* Card 3 */}
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardIconWrapper}>
                <MaterialCommunityIcons name="chart-bar" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.cardNumber}>{avgSession}m</Text>
            </View>
            <Text style={styles.cardLabel}>Average Session</Text>
          </View>

          {/* Card 4 */}
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardIconWrapper}>
                <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.cardNumber}>{Math.floor(bestDayTime / 60)}h {(bestDayTime % 60)}m</Text>
            </View>
            <Text style={styles.cardLabel}>Best Day</Text>
          </View>
        </View>

        </ScrollView>
      </SafeAreaView>
    </ExpoLinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 180, // Extra padding for floating tab bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: 'System',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#A8C7FF',
    lineHeight: 22,
    fontFamily: 'System',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 32,
    padding: 6,
    marginBottom: 32,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTabActive: {
    backgroundColor: PRIMARY_BLUE,
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#A8C7FF',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  chartContainer: {
    marginBottom: 96,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  highestIndicator: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: PRIMARY_BLUE,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  xLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: CHART_WIDTH,
    marginTop: 16,
    paddingHorizontal: 28,
  },
  xLabel: {
    fontSize: 12,
    color: '#A8C7FF',
    fontWeight: '500',
  },
  summaryHeader: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#A8C7FF',
    lineHeight: 20,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  card: {
    width: (width - 56 - 16) / 2, // 2 columns, 28 padding horizontal
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 144, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#A8C7FF',
  },
});
