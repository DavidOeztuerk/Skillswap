# PowerShell script to run all tests with code coverage

Write-Host "Starting Test Run with Code Coverage..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Clean previous coverage results
if (Test-Path ".\TestResults") {
    Remove-Item -Recurse -Force ".\TestResults"
}
if (Test-Path ".\CoverageReport") {
    Remove-Item -Recurse -Force ".\CoverageReport"
}

# Run tests with coverage for all test projects
$testProjects = @(
    "src\tests\unit\Shared.Tests\Shared.Tests.csproj",
    "src\tests\unit\UserService.Tests\UserService.Tests.csproj",
    "src\tests\unit\SkillService.Tests\SkillService.Tests.csproj",
    "src\tests\unit\MatchmakingService.Tests\MatchmakingService.Tests.csproj",
    "src\tests\unit\AppointmentService.Tests\AppointmentService.Tests.csproj",
    "src\tests\unit\NotificationService.Tests\NotificationService.Tests.csproj",
    "src\tests\unit\VideocallService.Tests\VideocallService.Tests.csproj",
    "src\tests\integration\UserService.IntegrationTests\UserService.IntegrationTests.csproj"
)

$totalTests = 0
$totalPassed = 0
$totalFailed = 0
$totalSkipped = 0

Write-Host "`nRunning Unit and Integration Tests..." -ForegroundColor Yellow

foreach ($project in $testProjects) {
    if (Test-Path $project) {
        Write-Host "`nTesting: $project" -ForegroundColor Cyan
        
        dotnet test $project `
            /p:CollectCoverage=true `
            /p:CoverletOutputFormat="cobertura" `
            /p:CoverletOutput=".\TestResults\Coverage\" `
            /p:ExcludeByFile="**/*Migrations/*.cs" `
            /p:Exclude="[*]*.Migrations.*" `
            --logger "console;verbosity=minimal" `
            --logger "trx;LogFileName=$($project.Replace('\', '_').Replace('.csproj', '.trx'))" `
            --results-directory ".\TestResults"
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Tests failed for $project" -ForegroundColor Red
            $totalFailed++
        } else {
            Write-Host "Tests passed for $project" -ForegroundColor Green
            $totalPassed++
        }
    } else {
        Write-Host "Project not found: $project" -ForegroundColor Yellow
        $totalSkipped++
    }
}

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "Test Summary:" -ForegroundColor Green
Write-Host "  Projects Tested: $($totalPassed + $totalFailed)" -ForegroundColor White
Write-Host "  Passed: $totalPassed" -ForegroundColor Green
Write-Host "  Failed: $totalFailed" -ForegroundColor Red
Write-Host "  Skipped: $totalSkipped" -ForegroundColor Yellow

# Generate HTML coverage report if tests passed
if ($totalPassed -gt 0) {
    Write-Host "`nGenerating Coverage Report..." -ForegroundColor Yellow
    
    # Check if ReportGenerator is installed
    $reportGeneratorPath = "$env:USERPROFILE\.nuget\packages\reportgenerator\*\tools\net*\ReportGenerator.exe"
    $reportGenerator = Get-ChildItem -Path $reportGeneratorPath -ErrorAction SilentlyContinue | Select-Object -First 1
    
    if ($reportGenerator) {
        & $reportGenerator.FullName `
            -reports:".\TestResults\Coverage\*.cobertura.xml" `
            -targetdir:".\CoverageReport" `
            -reporttypes:"Html;Cobertura;Badges;TextSummary" `
            -title:"Skillswap Backend Code Coverage" `
            -verbosity:"Info"
        
        Write-Host "`nCoverage Report Generated!" -ForegroundColor Green
        Write-Host "Open .\CoverageReport\index.html to view the report" -ForegroundColor Cyan
        
        # Display coverage summary
        if (Test-Path ".\CoverageReport\Summary.txt") {
            Write-Host "`nCoverage Summary:" -ForegroundColor Yellow
            Get-Content ".\CoverageReport\Summary.txt"
        }
    } else {
        Write-Host "`nReportGenerator not found. Installing..." -ForegroundColor Yellow
        dotnet tool install -g dotnet-reportgenerator-globaltool
        
        # Try again with global tool
        reportgenerator `
            -reports:".\TestResults\Coverage\*.cobertura.xml" `
            -targetdir:".\CoverageReport" `
            -reporttypes:"Html;Cobertura;Badges;TextSummary" `
            -title:"Skillswap Backend Code Coverage"
    }
    
    # Open report in browser
    $reportPath = (Resolve-Path ".\CoverageReport\index.html").Path
    if (Test-Path $reportPath) {
        Write-Host "`nOpening coverage report in browser..." -ForegroundColor Cyan
        Start-Process $reportPath
    }
}

Write-Host "`nTest run completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green