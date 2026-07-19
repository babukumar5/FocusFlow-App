import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useActivityStore } from '@/src/store/activityStore';
import { AnimatedPressable } from '@/src/components/common/AnimatedPressable';
import { useScreenTransition, CustomCardEntrance } from '@/src/utils/animations';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48; // padding 24 on each side
const CHART_HEIGHT = 320;
const PRIMARY_BLUE = '#1E90FF';
const LIGHT_BLUE = '#A8C7FF';
const HIGHLIGHT_BLUE = '#4da6ff';

// --- Bar Component ---
const AnimatedBar = React.memo(({ 
  value, 
  maxValue, 
  label, 
  index, 
  isHighlighted,
  isYear
}: { 
  value: number; 
  maxValue: number; 
  label: string; 
  index: number;
  isHighlighted: boolean;
  isYear: boolean;
}) => {
  const heightAnim = useSharedValue(0);

  useEffect(() => {
    heightAnim.value = 0;
    const targetHeight = maxValue > 0 ? (value / maxValue) * CHART_HEIGHT : 0;
    heightAnim.value = withDelay(index * 50, withTiming(targetHeight, { duration: 600, easing: Easing.out(Easing.exp) }));
  }, [value, maxValue, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: heightAnim.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -heightAnim.value - 8 }],
  }));

  const formatBarValue = (val: number) => {
    if (val === 0) return '';
    const h = Math.floor(val / 60);
    const m = val % 60;
    
    if (isYear) {
      if (h === 0) return `${m}m`;
      if (m === 0) return `${h}h`;
      return `${h}h\n${m}m`; // Multiline for year graph
    }

    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  };

  const barWidth = isYear ? 10 : 20;
  const highlightedBarWidth = isYear ? 12 : 24;

  return (
    <View style={styles.barColumn}>
      <View style={styles.barTouchable}>
        <View style={[styles.barBackground, { width: highlightedBarWidth }]}>
          <Animated.View style={[
            styles.barFill,
            { width: barWidth },
            animatedStyle,
            isHighlighted && [styles.barFillHighlighted, { width: highlightedBarWidth }]
          ]}>
            <ExpoLinearGradient
              colors={[isHighlighted ? HIGHLIGHT_BLUE : PRIMARY_BLUE, 'transparent']}
              style={styles.barGradient}
            />
          </Animated.View>
        </View>

        {value > 0 && (
          <Animated.View style={[styles.floatingTextContainer, textAnimatedStyle]} pointerEvents="none">
            <Text style={styles.barValueText}>{formatBarValue(value)}</Text>
          </Animated.View>
        )}
      </View>

      <View style={styles.barLabelContainer}>
        {label.split('\n').map((line, i) => (
          <Text key={i} style={[
            styles.barLabelText,
            isHighlighted && styles.barLabelTextHighlighted
          ]}>{line}</Text>
        ))}
      </View>
    </View>
  );
});

export default function ActivityScreen() {
  const [activeTab, setActiveTab] = useState<'Week' | 'Year'>('Week');
  
  const { summary, graphs } = useActivityStore();

  const activeSummary = activeTab === 'Week' ? summary.week : summary.year;
  const graphData = activeTab === 'Week' ? graphs.week : graphs.year;

  // Graph Transition Animation
  const graphOpacity = useSharedValue(1);
  const graphScale = useSharedValue(1);

  const handleTabChange = (tab: 'Week' | 'Year') => {
    if (activeTab === tab) return;
    
    // 1. Instantly hide the graph on the UI thread to prevent flicker
    graphOpacity.value = 0;
    graphScale.value = 0.98;
    
    // 2. Synchronously trigger the React re-render with new data
    setActiveTab(tab);
    
    // 3. Queue the fade-in animation slightly behind the render.
    // This ensures the UI thread has processed the `0` opacity and the new DOM
    // before it begins fading back to `1`.
    setTimeout(() => {
      graphOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
      graphScale.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
    }, 32);
  };

  const graphAnimatedStyle = useAnimatedStyle(() => ({
    opacity: graphOpacity.value,
    transform: [{ scale: graphScale.value }],
  }));

  // Segmented Control Animation
  const tabPosition = useSharedValue(0);
  useEffect(() => {
    tabPosition.value = withTiming(activeTab === 'Week' ? 0 : 1, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
  }, [activeTab]);

  const tabIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: tabPosition.value * ((width - 48 - 12) / 2) }],
    };
  });

  // Max value calculation for Y-axis
  const maxValue = useMemo(() => {
    const max = Math.max(...graphData.values, 0);
    if (max === 0) return 60; // default to 60m if empty
    // Round up to nearest nice number
    if (max <= 60) return 60;
    if (max <= 120) return 120;
    const hours = Math.ceil(max / 60);
    return hours * 60;
  }, [graphData.values]);

  const yAxisLabels = useMemo(() => {
    const labels = [];
    const steps = 4;
    for (let i = steps; i >= 0; i--) {
      const val = (maxValue / steps) * i;
      const h = Math.floor(val / 60);
      const m = val % 60;
      if (maxValue >= 120) {
         // Show hours if max is large
         labels.push(h > 0 ? `${h}h` : '0h');
      } else {
         // Show minutes
         labels.push(m > 0 ? `${m}m` : (h > 0 ? `${h * 60}m` : '0m'));
      }
    }
    return labels;
  }, [maxValue]);

  const hasSessions = graphData.values.some(v => v > 0);

  // Check current day/month for bold text, but no badges
  const now = new Date();
  const currentMonthIndex = now.getMonth();
  const currentDayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // 0-6 for Mon-Sun

  const screenStyle = useScreenTransition();

  return (
    <ExpoLinearGradient 
      colors={['#0E3366', '#030E29']} 
      start={{ x: 0.1, y: 0.1 }} 
      end={{ x: 0.9, y: 0.9 }} 
      style={styles.mainContainer}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <Animated.View style={screenStyle}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ width: '100%', flex: 1 }}>
              <Text style={styles.title}>Activity</Text>
              <Text style={styles.subtitle}>See your productivity</Text>
            </View>
          </View>

          {/* Segmented Control */}
          <View style={styles.segmentContainer}>
            <Animated.View style={[styles.segmentIndicator, tabIndicatorStyle]} />
            {['Week', 'Year'].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <AnimatedPressable
                  key={tab}
                  style={styles.segmentTab}
                  onPress={() => handleTabChange(tab as any)}
                >
                  <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>
                    {tab}
                  </Text>
                </AnimatedPressable>
              );
            })}
          </View>

          {/* Chart Area */}
          <View style={styles.chartCard}>
            
            <Animated.View style={[styles.chartContainer, graphAnimatedStyle]}>
              {/* Bars */}
              <View style={styles.barsContainer}>
                {graphData.values.map((val, i) => {
                  const isHighlighted = activeTab === 'Week' ? i === currentDayOfWeek : i === currentMonthIndex;
                  return (
                    <AnimatedBar
                      key={i}
                      value={val}
                      maxValue={maxValue}
                      label={graphData.labels[i]}
                      index={i}
                      isHighlighted={isHighlighted}
                      isYear={activeTab === 'Year'}
                    />
                  );
                })}
              </View>
            </Animated.View>

            {/* Empty State Overlay */}
            {!hasSessions && (
              <Animated.View style={[styles.emptyStateContainer, graphAnimatedStyle]} pointerEvents="none">
                <Text style={styles.emptyStateText}>Complete your first focus session to view your productivity.</Text>
              </Animated.View>
            )}
          </View>

          {/* Cards Grid */}
          <View style={styles.cardsGrid}>
            <Animated.View entering={CustomCardEntrance(0)} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrapper}>
                  <MaterialCommunityIcons name="timer-outline" size={22} color={PRIMARY_BLUE} />
                </View>
                <Text style={styles.cardNumber}>{activeSummary.card1.value}</Text>
              </View>
              <Text style={styles.cardLabel}>{activeSummary.card1.label}</Text>
              <Text style={styles.cardSubtitle}>{activeSummary.card1.subtitle}</Text>
            </Animated.View>

            <Animated.View entering={CustomCardEntrance(50)} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrapper}>
                  <MaterialCommunityIcons name="calendar-check-outline" size={20} color={PRIMARY_BLUE} />
                </View>
                <Text style={styles.cardNumber}>{activeSummary.card2.value}</Text>
              </View>
              <Text style={styles.cardLabel}>{activeSummary.card2.label}</Text>
              <Text style={styles.cardSubtitle}>{activeSummary.card2.subtitle}</Text>
            </Animated.View>

            <Animated.View entering={CustomCardEntrance(100)} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrapper}>
                  <MaterialCommunityIcons name="star" size={22} color={PRIMARY_BLUE} />
                </View>
                <Text style={styles.cardNumber}>{activeSummary.card4.value}</Text>
              </View>
              <Text style={styles.cardLabel}>{activeSummary.card4.label}</Text>
              <Text style={styles.cardSubtitle}>{activeSummary.card4.subtitle}</Text>
            </Animated.View>

            <Animated.View entering={CustomCardEntrance(150)} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrapper}>
                  <MaterialCommunityIcons name="fire" size={22} color={PRIMARY_BLUE} />
                </View>
                <Text style={styles.cardNumber}>{activeSummary.card3.value}</Text>
              </View>
              <Text style={styles.cardLabel}>{activeSummary.card3.label}</Text>
              <Text style={styles.cardSubtitle}>{activeSummary.card3.subtitle}</Text>
            </Animated.View>
          </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ExpoLinearGradient>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 180,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
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
    color: LIGHT_BLUE,
    lineHeight: 22,
    fontFamily: 'System',
  },
  segmentContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 32,
    padding: 6,
    marginBottom: 24,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  segmentIndicator: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: (width - 48 - 12) / 2, // Half the container width minus padding
    height: '100%',
    backgroundColor: PRIMARY_BLUE,
    borderRadius: 26,
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1, // Be above indicator
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: LIGHT_BLUE,
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  chartCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 24,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  chartContainer: {
    height: CHART_HEIGHT,
    flexDirection: 'row',
    position: 'relative',
    marginTop: 10,
    marginBottom: 40, // Space for X labels
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  floatingTextContainer: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    width: 60,
    zIndex: 10,
  },
  barValueText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  barTouchable: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barBackground: {
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    borderRadius: 6, // Fully rounded (top and bottom)
    overflow: 'hidden',
    backgroundColor: PRIMARY_BLUE,
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  barFillHighlighted: {
    backgroundColor: HIGHLIGHT_BLUE,
    shadowColor: HIGHLIGHT_BLUE,
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
  barGradient: {
    flex: 1,
  },
  barLabelContainer: {
    position: 'absolute',
    bottom: -40,
    alignItems: 'center',
    height: 40,
    justifyContent: 'flex-start',
  },
  barLabelText: {
    fontSize: 10,
    color: LIGHT_BLUE,
    textAlign: 'center',
    lineHeight: 14,
  },
  barLabelTextHighlighted: {
    color: PRIMARY_BLUE,
    fontWeight: '700',
  },
  emptyStateContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    bottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 11, 46, 0.6)',
    borderRadius: 16,
  },
  emptyStateText: {
    color: LIGHT_BLUE,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  card: {
    width: (width - 48 - 12) / 2, // 2 columns, 24 padding horiz
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(30, 144, 255, 0.35)',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  cardNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  cardSubtitle: {
    fontSize: 11,
    color: LIGHT_BLUE,
    lineHeight: 16,
  },
});
