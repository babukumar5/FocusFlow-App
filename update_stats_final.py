import re

with open("app/(tabs)/stats.tsx", "r") as f:
    content = f.read()

# 1. Reduce chart container height
content = content.replace("const CHART_HEIGHT = 340;", "const CHART_HEIGHT = 290;")

# 2. Summary cards size reduction (make slightly narrower and shorter)
# Old card width: width: (width - 40 - 16) / 2
# Let's increase horizontal padding of container from 20 to 28 (which makes cards narrower)
# And reduce card padding from 16 to 14, icon size from 36 to 32.
content = content.replace("paddingHorizontal: 20,", "paddingHorizontal: 28,")
# Also need to update the card width calculation
content = content.replace("width: (width - 40 - 16) / 2, // 2 columns, 20 padding horizontal", "width: (width - 56 - 16) / 2, // 2 columns, 28 padding horizontal")

# Reduce card inner padding
content = content.replace("""    borderRadius: 16,
    padding: 16,""", """    borderRadius: 16,
    padding: 14,""")

# Reduce icon wrapper size
content = content.replace("""  cardIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,""", """  cardIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,""")

# Reduce icon size in the JSX
content = content.replace("""size={22} color="#FFFFFF\"""", """size={20} color="#FFFFFF\"""")

# Reduce card numbers slightly
content = content.replace("""  cardNumber: {
    fontSize: 22,""", """  cardNumber: {
    fontSize: 20,""")

# Reduce label size slightly
content = content.replace("""  cardLabel: {
    fontSize: 13,""", """  cardLabel: {
    fontSize: 12,""")

# 3. Spacing adjustments
# Increase spacing between subtitle and segmented control (header marginBottom)
content = content.replace("""  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },""", """  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },""")

# Increase spacing below chart (chartContainer marginBottom)
# We want Activity Summary pushed completely off-screen.
content = content.replace("""  chartContainer: {
    marginBottom: 64,""", """  chartContainer: {
    marginBottom: 96,""")

# 4. Bottom padding for ScrollView
content = content.replace("""    paddingBottom: 140, // Extra padding for floating tab bar""", """    paddingBottom: 180, // Extra padding for floating tab bar""")

# 5. Fix X-axis spacing to match new chart width if needed
# The paddingX is currently 40. We can leave it as is.
# Re-adjust paddingY of chart? 20 is fine.

with open("app/(tabs)/stats.tsx", "w") as f:
    f.write(content)
