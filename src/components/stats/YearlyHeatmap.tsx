import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme, Menu, Card } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { spacing } from '@/src/constants';
import { AnimatedPressable } from '@/src/components/common/AnimatedPressable';

interface Session {
  date: string;
  actualCompletedMinutes: number;
  mode: string;
}

interface YearlyHeatmapProps {
  sessions: Session[];
  selectedYear: number;
  onYearChange: (year: number) => void;
}

const generateHeatmapGrid = (year: number) => {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  // getDay() gives 0 for Sun, 1 for Mon. We want Mon=0 ... Sun=6.
  const startDay = (startDate.getDay() + 6) % 7;
  
  // We'll create exactly 54 columns to ensure we fit a full year.
  const cols = 54;
  const grid: (string | null)[][] = Array.from({ length: 7 }, () => new Array(cols).fill(null));
  
  let currDate = new Date(startDate);
  let col = 0;
  let row = startDay;
  
  while (currDate <= endDate) {
    const y = currDate.getFullYear();
    const m = String(currDate.getMonth() + 1).padStart(2, '0');
    const d = String(currDate.getDate()).padStart(2, '0');
    grid[row][col] = `${y}-${m}-${d}`;
    
    currDate.setDate(currDate.getDate() + 1);
    row++;
    if (row > 6) {
      row = 0;
      col++;
    }
  }
  return grid;
};

const getColor = (minutes: number) => {
  if (minutes === 0) return '#161B22'; 
  if (minutes < 30) return '#0E4429';
  if (minutes < 60) return '#006D32';
  if (minutes < 90) return '#26A641';
  return '#39D353';
};

export default function YearlyHeatmap({ sessions, selectedYear, onYearChange }: YearlyHeatmapProps) {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  
  const grid = generateHeatmapGrid(selectedYear);
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const monthLabels: { label: string, col: number }[] = [];
  let currentMonth = -1;
  for (let c = 0; c < grid[0].length; c++) {
    const dateStr = grid[0][c] || grid[1][c] || grid[2][c] || grid[3][c] || grid[4][c] || grid[5][c] || grid[6][c];
    if (dateStr) {
      const month = parseInt(dateStr.split('-')[1], 10) - 1;
      if (month !== currentMonth) {
        monthLabels.push({
          label: new Date(selectedYear, month, 1).toLocaleString('default', { month: 'short' }),
          col: c
        });
        currentMonth = month;
      }
    }
  }

  const dailyMap: Record<string, number> = {};
  sessions.forEach(s => {
    if (!dailyMap[s.date]) dailyMap[s.date] = 0;
    dailyMap[s.date] += s.actualCompletedMinutes;
  });

  const availableYears = [selectedYear + 1, selectedYear, selectedYear - 1, selectedYear - 2, selectedYear - 3];

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content>
        <View style={styles.header}>
          <AnimatedPressable onPress={() => onYearChange(selectedYear - 1)} style={styles.iconBtn}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={theme.colors.onSurfaceVariant} />
          </AnimatedPressable>
          
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <AnimatedPressable onPress={() => setMenuVisible(true)} style={styles.yearSelector}>
                <Text style={[styles.yearText, { color: theme.colors.primary }]}>{selectedYear}</Text>
                <MaterialCommunityIcons name="menu-down" size={20} color={theme.colors.primary} />
              </AnimatedPressable>
            }
            contentStyle={{ backgroundColor: theme.colors.elevation.level2 }}
          >
            {availableYears.map(y => (
              <Menu.Item 
                key={y} 
                onPress={() => { onYearChange(y); setMenuVisible(false); }} 
                title={y.toString()} 
              />
            ))}
          </Menu>

          <AnimatedPressable onPress={() => onYearChange(selectedYear + 1)} style={styles.iconBtn}>
            <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
          </AnimatedPressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.heatmapScroll}>
          <View>
            <View style={styles.monthLabelsRow}>
              <View style={styles.yAxisLabelSpace} />
              <View style={styles.gridContainer}>
                {monthLabels.map((ml, idx) => (
                  <Text 
                    key={idx} 
                    style={[styles.monthLabel, { color: theme.colors.onSurfaceVariant, left: ml.col * 14 }]}
                  >
                    {ml.label}
                  </Text>
                ))}
              </View>
            </View>
            
            <View style={styles.heatmapBody}>
              <View style={styles.weekdaysCol}>
                {weekdays.map((wd, i) => (
                  <Text key={i} style={[styles.weekdayText, { color: theme.colors.onSurfaceVariant, opacity: i % 2 === 0 ? 1 : 0 }]}>
                    {wd}
                  </Text>
                ))}
              </View>
              
              <View style={styles.gridContainer}>
                {grid.map((row, rIdx) => (
                  <View key={rIdx} style={styles.heatmapRow}>
                    {row.map((dateStr, cIdx) => {
                      const mins = dateStr ? (dailyMap[dateStr] || 0) : 0;
                      return (
                        <View 
                          key={cIdx} 
                          style={[
                            styles.cell, 
                            { backgroundColor: dateStr ? getColor(mins) : 'transparent' }
                          ]} 
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.legend}>
          <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>Less</Text>
          <View style={[styles.legendCell, { backgroundColor: '#161B22' }]} />
          <View style={[styles.legendCell, { backgroundColor: '#0E4429' }]} />
          <View style={[styles.legendCell, { backgroundColor: '#006D32' }]} />
          <View style={[styles.legendCell, { backgroundColor: '#26A641' }]} />
          <View style={[styles.legendCell, { backgroundColor: '#39D353' }]} />
          <Text style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}>More</Text>
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
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconBtn: {
    padding: spacing.xs,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  yearText: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 4,
  },
  heatmapScroll: {
    marginBottom: spacing.md,
  },
  monthLabelsRow: {
    flexDirection: 'row',
    marginBottom: 4,
    height: 16,
  },
  yAxisLabelSpace: {
    width: 28,
  },
  monthLabel: {
    fontSize: 10,
    position: 'absolute',
  },
  heatmapBody: {
    flexDirection: 'row',
  },
  weekdaysCol: {
    width: 28,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  weekdayText: {
    fontSize: 10,
    height: 12,
    lineHeight: 12,
  },
  gridContainer: {
    flexDirection: 'column',
  },
  heatmapRow: {
    flexDirection: 'row',
  },
  cell: {
    width: 11,
    height: 11,
    borderRadius: 2,
    marginRight: 3,
    marginBottom: 3,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  legendText: {
    fontSize: 12,
    marginHorizontal: spacing.sm,
  },
  legendCell: {
    width: 11,
    height: 11,
    borderRadius: 2,
    marginHorizontal: 2,
  }
});
