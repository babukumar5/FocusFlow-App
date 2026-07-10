import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme, Card } from 'react-native-paper';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { spacing } from '@/src/constants';

interface Session {
  date: string;
  actualCompletedMinutes: number;
}

interface DailyBarChartProps {
  sessions: Session[];
  selectedYear: number;
}

const AnimatedBar = ({ value, maxVal, height, color }: { value: number, maxVal: number, height: number, color: string }) => {
  const animatedHeight = useSharedValue(0);

  useEffect(() => {
    const pct = maxVal > 0 ? value / maxVal : 0;
    const target = Math.max(value > 0 ? 4 : 0, pct * height);
    animatedHeight.value = withTiming(target, { duration: 600, easing: Easing.out(Easing.cubic) });
  }, [value, maxVal, height]);

  const style = useAnimatedStyle(() => ({
    height: animatedHeight.value,
    backgroundColor: color,
  }));

  return <Animated.View style={[styles.bar, style]} />;
};

export default function DailyBarChart({ sessions, selectedYear }: DailyBarChartProps) {
  const theme = useTheme();
  
  const data = [];
  const startDate = new Date(selectedYear, 0, 1);
  const endDate = new Date(selectedYear, 11, 31);
  
  const dailyMap: Record<string, number> = {};
  sessions.forEach(s => {
    if (!dailyMap[s.date]) dailyMap[s.date] = 0;
    dailyMap[s.date] += s.actualCompletedMinutes;
  });

  let maxVal = 10; 

  let currDate = new Date(startDate);
  while (currDate <= endDate) {
    const y = currDate.getFullYear();
    const m = String(currDate.getMonth() + 1).padStart(2, '0');
    const d = String(currDate.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    
    const minutes = dailyMap[dateStr] || 0;
    if (minutes > maxVal) maxVal = minutes;

    data.push({
      dateStr,
      minutes,
      isFirstOfMonth: currDate.getDate() === 1,
      monthLabel: currDate.toLocaleString('default', { month: 'short' }),
    });
    currDate.setDate(currDate.getDate() + 1);
  }

  const CHART_HEIGHT = 120;
  const BAR_WIDTH = 6;
  const BAR_SPACING = 3;

  const gridLines = [maxVal, maxVal / 2, 0];

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.chartContainer}>
          {/* Background Grid */}
          <View style={styles.gridContainer}>
            {gridLines.map((val, i) => (
              <View key={i} style={[styles.gridLine, { borderBottomColor: 'rgba(255,255,255,0.1)' }]}>
                <Text style={[styles.gridText, { color: theme.colors.onSurfaceVariant }]}>{Math.round(val)}</Text>
              </View>
            ))}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={[styles.barsContainer, { height: CHART_HEIGHT }]}>
              {data.map((d, i) => (
                <View key={i} style={[styles.barWrapper, { width: BAR_WIDTH + BAR_SPACING }]}>
                  <AnimatedBar 
                    value={d.minutes} 
                    maxVal={maxVal} 
                    height={CHART_HEIGHT} 
                    color={d.minutes > 0 ? theme.colors.primary : theme.colors.surfaceVariant + '40'} 
                  />
                  {d.isFirstOfMonth && (
                    <Text style={[styles.monthLabel, { color: theme.colors.onSurfaceVariant, width: 30 }]}>
                      {d.monthLabel}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  chartContainer: {
    height: 160,
    position: 'relative',
    marginTop: spacing.sm,
  },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 24,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  gridLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 2,
  },
  gridText: {
    fontSize: 10,
    position: 'absolute',
    left: 0,
    bottom: 2,
  },
  scrollContent: {
    paddingLeft: 24,
    paddingRight: 12,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 2,
    marginTop: 10, 
  },
  barWrapper: {
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
  },
  bar: {
    width: 6,
    borderRadius: 3,
  },
  monthLabel: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    fontSize: 10,
  }
});
