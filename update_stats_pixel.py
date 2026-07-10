import re

with open("app/(tabs)/stats.tsx", "r") as f:
    content = f.read()

# 1. Height and Spacing Variables
content = content.replace("const CHART_HEIGHT = 180;", "const CHART_HEIGHT = 340;")

# 2. Card Layout
old_card1 = """          {/* Card 1 */}
          <View style={styles.card}>
            <View style={styles.cardIconWrapper}>
              <MaterialCommunityIcons name="clock" size={24} color={PRIMARY_BLUE} />
            </View>
            <Text style={styles.cardNumber}>{Math.floor(totalTime / 60)}h {(totalTime % 60)}m</Text>
            <Text style={styles.cardLabel}>Total Focus Time</Text>
          </View>"""
new_card1 = """          {/* Card 1 */}
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardIconWrapper}>
                <MaterialCommunityIcons name="clock-outline" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.cardNumber}>{Math.floor(totalTime / 60)}h {(totalTime % 60)}m</Text>
            </View>
            <Text style={styles.cardLabel}>Total Focus Time</Text>
          </View>"""
content = content.replace(old_card1, new_card1)

old_card2 = """          {/* Card 2 */}
          <View style={styles.card}>
            <View style={styles.cardIconWrapper}>
              <MaterialCommunityIcons name="calendar-check" size={24} color={PRIMARY_BLUE} />
            </View>
            <Text style={styles.cardNumber}>{totalSessions}</Text>
            <Text style={styles.cardLabel}>Total Sessions</Text>
          </View>"""
new_card2 = """          {/* Card 2 */}
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardIconWrapper}>
                <MaterialCommunityIcons name="calendar-check" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.cardNumber}>{totalSessions}</Text>
            </View>
            <Text style={styles.cardLabel}>Total Sessions</Text>
          </View>"""
content = content.replace(old_card2, new_card2)

old_card3 = """          {/* Card 3 */}
          <View style={styles.card}>
            <View style={styles.cardIconWrapper}>
              <MaterialCommunityIcons name="chart-bar" size={24} color={PRIMARY_BLUE} />
            </View>
            <Text style={styles.cardNumber}>{avgSession}m</Text>
            <Text style={styles.cardLabel}>Average Session</Text>
          </View>"""
new_card3 = """          {/* Card 3 */}
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardIconWrapper}>
                <MaterialCommunityIcons name="chart-bar" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.cardNumber}>{avgSession}m</Text>
            </View>
            <Text style={styles.cardLabel}>Average Session</Text>
          </View>"""
content = content.replace(old_card3, new_card3)

old_card4 = """          {/* Card 4 */}
          <View style={styles.card}>
            <View style={styles.cardIconWrapper}>
              <MaterialCommunityIcons name="lightning-bolt" size={24} color={PRIMARY_BLUE} />
            </View>
            <Text style={styles.cardNumber}>{Math.floor(bestDayTime / 60)}h {(bestDayTime % 60)}m</Text>
            <Text style={styles.cardLabel}>Best Day</Text>
          </View>"""
new_card4 = """          {/* Card 4 */}
          <View style={styles.card}>
            <View style={styles.cardTopRow}>
              <View style={styles.cardIconWrapper}>
                <MaterialCommunityIcons name="lightning-bolt" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.cardNumber}>{Math.floor(bestDayTime / 60)}h {(bestDayTime % 60)}m</Text>
            </View>
            <Text style={styles.cardLabel}>Best Day</Text>
          </View>"""
content = content.replace(old_card4, new_card4)

# 3. Y Axis Position Adjustment
# Shift lines slightly right to not overlap text, and text slightly right.
content = content.replace("""                  <Line x1="35" y1={y} x2={CHART_WIDTH} y2={y} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" strokeDasharray="4 4" />
                  <SvgText x="0" y={y + 4} fill="#A8C7FF" fontSize="11" fontWeight="500">{val}m</SvgText>""",
"""                  <Line x1="45" y1={y} x2={CHART_WIDTH - 15} y2={y} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" strokeDasharray="4 4" />
                  <SvgText x="15" y={y + 4} fill="#A8C7FF" fontSize="11" fontWeight="500">{val}m</SvgText>""")

# 4. Styles Redefinition
styles_start = content.find("const styles = StyleSheet.create({")
content = content[:styles_start] + """const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E90FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 140, // Extra padding for floating tab bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
    marginBottom: 64,
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
    paddingHorizontal: 20,
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
    width: (width - 40 - 16) / 2, // 2 columns, 20 padding horizontal
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(30, 144, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  cardNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#A8C7FF',
  },
});
"""

with open("app/(tabs)/stats.tsx", "w") as f:
    f.write(content)
