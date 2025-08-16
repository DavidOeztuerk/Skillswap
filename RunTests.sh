#!/bin/bash

# Bash script to run all tests with code coverage

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Test Run with Code Coverage...${NC}"
echo -e "${GREEN}========================================${NC}"

# Clean previous coverage results
rm -rf ./TestResults
rm -rf ./CoverageReport

# Test projects array
test_projects=(
    "src/tests/unit/Shared.Tests/Shared.Tests.csproj"
    "src/tests/unit/UserService.Tests/UserService.Tests.csproj"
    "src/tests/unit/SkillService.Tests/SkillService.Tests.csproj"
    "src/tests/unit/MatchmakingService.Tests/MatchmakingService.Tests.csproj"
    "src/tests/unit/AppointmentService.Tests/AppointmentService.Tests.csproj"
    "src/tests/unit/NotificationService.Tests/NotificationService.Tests.csproj"
    "src/tests/unit/VideocallService.Tests/VideocallService.Tests.csproj"
    "src/tests/integration/UserService.IntegrationTests/UserService.IntegrationTests.csproj"
)

total_tests=0
total_passed=0
total_failed=0
total_skipped=0

echo -e "\n${YELLOW}Running Unit and Integration Tests...${NC}"

for project in "${test_projects[@]}"; do
    if [ -f "$project" ]; then
        echo -e "\n${CYAN}Testing: $project${NC}"
        
        dotnet test "$project" \
            /p:CollectCoverage=true \
            /p:CoverletOutputFormat="cobertura" \
            /p:CoverletOutput="./TestResults/Coverage/" \
            /p:ExcludeByFile="**/*Migrations/*.cs" \
            /p:Exclude="[*]*.Migrations.*" \
            --logger "console;verbosity=minimal" \
            --logger "trx;LogFileName=$(echo $project | tr '/' '_' | sed 's/.csproj/.trx/')" \
            --results-directory "./TestResults"
        
        if [ $? -ne 0 ]; then
            echo -e "${RED}Tests failed for $project${NC}"
            ((total_failed++))
        else
            echo -e "${GREEN}Tests passed for $project${NC}"
            ((total_passed++))
        fi
    else
        echo -e "${YELLOW}Project not found: $project${NC}"
        ((total_skipped++))
    fi
done

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Test Summary:${NC}"
echo -e "${WHITE}  Projects Tested: $((total_passed + total_failed))${NC}"
echo -e "${GREEN}  Passed: $total_passed${NC}"
echo -e "${RED}  Failed: $total_failed${NC}"
echo -e "${YELLOW}  Skipped: $total_skipped${NC}"

# Generate HTML coverage report if tests passed
if [ $total_passed -gt 0 ]; then
    echo -e "\n${YELLOW}Generating Coverage Report...${NC}"
    
    # Check if reportgenerator is installed
    if ! command -v reportgenerator &> /dev/null; then
        echo -e "${YELLOW}ReportGenerator not found. Installing...${NC}"
        dotnet tool install -g dotnet-reportgenerator-globaltool
        export PATH="$PATH:$HOME/.dotnet/tools"
    fi
    
    # Generate report
    reportgenerator \
        -reports:"./TestResults/Coverage/*.cobertura.xml" \
        -targetdir:"./CoverageReport" \
        -reporttypes:"Html;Cobertura;Badges;TextSummary" \
        -title:"Skillswap Backend Code Coverage" \
        -verbosity:"Info"
    
    echo -e "\n${GREEN}Coverage Report Generated!${NC}"
    echo -e "${CYAN}Open ./CoverageReport/index.html to view the report${NC}"
    
    # Display coverage summary
    if [ -f "./CoverageReport/Summary.txt" ]; then
        echo -e "\n${YELLOW}Coverage Summary:${NC}"
        cat "./CoverageReport/Summary.txt"
    fi
    
    # Try to open report in browser (platform-specific)
    report_path="$(pwd)/CoverageReport/index.html"
    if [ -f "$report_path" ]; then
        echo -e "\n${CYAN}Opening coverage report in browser...${NC}"
        
        # Detect OS and open browser
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open "$report_path" 2>/dev/null &
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            open "$report_path"
        elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
            start "$report_path"
        fi
    fi
fi

echo -e "\n${GREEN}Test run completed!${NC}"
echo -e "${GREEN}========================================${NC}"