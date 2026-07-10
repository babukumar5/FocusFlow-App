import re

with open("app/(tabs)/stats.tsx", "r") as f:
    content = f.read()

# 1. Imports
content = content.replace("import { SafeAreaView } from 'react-native-safe-area-context';",
"""import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';""")

# 2. Colors
content = content.replace("const PURPLE = '#7952FF';", "const PRIMARY_BLUE = '#1E90FF';")
content = content.replace("color={PURPLE}", "color={PRIMARY_BLUE}")
content = content.replace("color: PURPLE", "color: PRIMARY_BLUE")
content = content.replace("backgroundColor: PURPLE", "backgroundColor: PRIMARY_BLUE")
content = content.replace("shadowColor: PURPLE", "shadowColor: PRIMARY_BLUE")
content = content.replace("borderColor: PURPLE", "borderColor: PRIMARY_BLUE")
content = content.replace("stroke={PURPLE}", "stroke={PRIMARY_BLUE}")
content = content.replace("stopColor={PURPLE}", "stopColor={PRIMARY_BLUE}")

# 3. Chart Layout
content = content.replace("const paddingX = 10;", "const paddingX = 40;")

# 4. Y Axis and Grid Lines
old_grid = """            {/* Grid Lines */}
            {[0, 1, 2, 3, 4].map((i) => {
              const y = 20 + (i * (CHART_HEIGHT - 40)) / 4;
              return (
                <Line key={i} x1="0" y1={y} x2={CHART_WIDTH} y2={y} stroke="#E5E5EA" strokeWidth="1" />
              );
            })}"""
new_grid = """            {/* Grid Lines & Y Labels */}
            {[0, 1, 2, 3, 4].map((i) => {
              const y = 20 + (i * (CHART_HEIGHT - 40)) / 4;
              const val = (4 - i) * 15;
              return (
                <React.Fragment key={i}>
                  <Line x1="35" y1={y} x2={CHART_WIDTH} y2={y} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" strokeDasharray="4 4" />
                  <SvgText x="0" y={y + 4} fill="#A8C7FF" fontSize="11" fontWeight="500">{val}m</SvgText>
                </React.Fragment>
              );
            })}"""
content = content.replace(old_grid, new_grid)

# 5. Background and Header
old_return = """  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Activity</Text>
          <Text style={styles.subtitle}>See your productivity and focus statistics.</Text>
        </View>"""
new_return = """  return (
    <ExpoLinearGradient colors={['#020B2E', '#0A2F73']} style={styles.gradientBg}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Activity</Text>
              <Text style={styles.subtitle}>See your productivity and focus statistics.</Text>
            </View>
            <TouchableOpacity style={styles.settingsButton}>
              <MaterialCommunityIcons name="cog" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>"""
content = content.replace(old_return, new_return)

content = content.replace("      </ScrollView>\n    </SafeAreaView>\n  );", "        </ScrollView>\n      </SafeAreaView>\n    </ExpoLinearGradient>\n  );")

# 6. Styles
style_replacements = {
    "backgroundColor: '#F8F8FC',": "backgroundColor: 'transparent',",
    "color: '#1C1C1E',": "color: '#FFFFFF',",
    "color: '#8E8E93',": "color: '#A8C7FF',",
    "backgroundColor: '#F0F0F5',": "backgroundColor: 'rgba(255, 255, 255, 0.08)',\n    borderWidth: 1,\n    borderColor: 'rgba(255, 255, 255, 0.1)',",
    "color: '#AEAEC0',": "color: '#A8C7FF',",
    "backgroundColor: '#FFFFFF',": "backgroundColor: 'rgba(255, 255, 255, 0.08)',",
    "shadowColor: '#000',": "shadowColor: '#1E90FF',",
    "shadowOpacity: 0.04,": "shadowOpacity: 0.15,",
    "backgroundColor: '#F4F1FF',": "backgroundColor: 'rgba(30, 144, 255, 0.15)',"
}
for k, v in style_replacements.items():
    content = content.replace(k, v)

# Add specific styles
new_styles = """const styles = StyleSheet.create({
  gradientBg: {
    flex: 1,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E90FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1E90FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },"""
content = content.replace("const styles = StyleSheet.create({", new_styles)

# Fix header flexDirection
content = content.replace("""  header: {
    marginBottom: 32,
  },""", """  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },""")

# Fix chart container style to add glassmorphism
content = content.replace("""  chartContainer: {
    marginBottom: 48,
    alignItems: 'center',
  },""", """  chartContainer: {
    marginBottom: 48,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },""")

# Fix indicator
content = content.replace("backgroundColor: 'rgba(255, 255, 255, 0.08)',\n    borderWidth: 3", "backgroundColor: '#020B2E',\n    borderWidth: 3")
# The previous line might accidentally match if there are multiple. Let's do it precisely:
content = content.replace("""  highestIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 3,
    borderColor: PRIMARY_BLUE,
  },""", """  highestIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#020B2E',
    borderWidth: 3,
    borderColor: PRIMARY_BLUE,
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },""")

with open("app/(tabs)/stats.tsx", "w") as f:
    f.write(content)
