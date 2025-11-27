import re

# Read the file
with open(r'c:\Users\Renato Junio\Documents\GitHub\controle-de-horarios\apps\controle-de-horarios-frontend\src\pages\controle-horarios\ControleHorariosPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the fullscreen div opening
old_pattern = r"        {Array\.isArray\(controleHorarios\) && controleHorarios\.length > 0 \? \(\r?\n          <div className=\{isTableFullScreen \? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-0 overflow-auto' : ''\}>"

new_replacement = """        {/* Fullscreen Modal Overlay */}
        {isTableFullScreen && Array.isArray(controleHorarios) && controleHorarios.length > 0 && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
            <div className="fixed inset-0 bg-white dark:bg-gray-900 overflow-auto">"""

content = re.sub(old_pattern, new_replacement, content)

# Add closing divs before the ternary operator's closing
old_end = r"            </div>\r?\n          </div>\r?\n        \) : \("

new_end = """            </div>
          </div>
        )}

        {/* Normal View */}
        {!isTableFullScreen && Array.isArray(controleHorarios) && controleHorarios.length > 0 && (
          <div>"""

content = re.sub(old_end, new_end, content)

# Fix the empty state condition
old_empty = r"        \) : \(\r?\n          <div className=\"text-center py-12"

new_empty = """          </div>
        )}

        {/* Empty State */}
        {!isTableFullScreen && Array.isArray(controleHorarios) && controleHorarios.length === 0 && (
          <div className="text-center py-12"""

content = re.sub(old_empty, new_empty, content)

# Write back
with open(r'c:\Users\Renato Junio\Documents\GitHub\controle-de-horarios\apps\controle-de-horarios-frontend\src\pages\controle-horarios\ControleHorariosPage.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("File updated successfully!")
