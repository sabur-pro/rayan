# PowerShell script to fix createStyles types in all screen files

$files = @(
    "src\screens\AIAssistantScreen.tsx",
    "src\screens\FavoritesScreen.tsx",
    "src\screens\HomeScreen.tsx",
    "src\screens\LoginScreen.tsx",
    "src\screens\MaterialsScreen.tsx",
    "src\screens\MaterialTypesScreen.tsx",
    "src\screens\MaterialViewerScreen.tsx",
    "src\screens\RegisterScreen.tsx",
    "src\screens\TestResultsScreen.tsx",
    "src\screens\TestScreen.tsx",
    "src\screens\TestSetupScreen.tsx",
    "src\screens\VerificationScreen.tsx",
    "src\screens\WelcomeScreen.tsx"
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw
    $content = $content -replace 'const createStyles = \(colors: typeof lightTheme\) =>', 'const createStyles = (colors: ReturnType<typeof getThemeColors>) =>'
    Set-Content -Path $file -Value $content -NoNewline
    Write-Host "Fixed: $file"
}

Write-Host "`nAll files updated successfully!"
