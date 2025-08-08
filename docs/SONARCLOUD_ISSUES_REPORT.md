# SonarCloud 이슈 분석 보고서

**프로젝트**: elice-next  
**조직**: elice365  
**분석 날짜**: 2025-08-08  
**마지막 분석**: 2025-08-08T18:10:07+0000  
**커밋**: 6011caf60b0e66dfdf58821e5af4286b57e0cae1


⏺ SonarCloud 이슈 조회 명령어들:

  🔍 기본 이슈 조회

  # 전체 이슈 조회
  curl --request GET \
    --url 'https://sonarcloud.io/api/issues/search?componentKeys=elice365_elice-next' \
    --header 'Authorization: Bearer YOUR_TOKEN'

  # 페이지 크기 지정 (최대 500개)
  curl --request GET \
    --url 'https://sonarcloud.io/api/issues/search?componentKeys=elice365_elice-next&ps=500' \
    --header 'Authorization: Bearer YOUR_TOKEN'

  🚨 심각도별 조회

  # Critical 이슈만
  curl --request GET \
    --url 'https://sonarcloud.io/api/issues/search?componentKeys=elice365_elice-next&severities=CRITICAL' \
    --header 'Authorization: Bearer YOUR_TOKEN'

  # Major 이슈만
  curl --request GET \
    --url 'https://sonarcloud.io/api/issues/search?componentKeys=elice365_elice-next&severities=MAJOR' \
    --header 'Authorization: Bearer YOUR_TOKEN'

  # 여러 심각도
  curl --request GET \
    --url 'https://sonarcloud.io/api/issues/search?componentKeys=elice365_elice-next&severities=CRITICAL,MAJOR' \
    --header 'Authorization: Bearer YOUR_TOKEN'

  📁 특정 파일/폴더 조회

  # 특정 파일의 이슈
  curl --request GET \
    --url 'https://sonarcloud.io/api/issues/search?componentKeys=elice365_elice-next:components/features/blog/Card.tsx' \
    --header 'Authorization: Bearer YOUR_TOKEN'

  # 특정 폴더의 이슈 (와일드카드 사용)
  curl --request GET \
    --url 'https://sonarcloud.io/api/issues/search?componentKeys=elice365_elice-next&components=*blog*' \
    --header 'Authorization: Bearer YOUR_TOKEN'

  🏷️ 규칙별 조회

  # 특정 규칙의 이슈들
  curl --request GET \
    --url 'https://sonarcloud.io/api/issues/search?componentKeys=elice365_elice-next&rules=typescript:S3776' \
    --header 'Authorization: Bearer YOUR_TOKEN'

  # 복잡도 관련 이슈들
  curl --request GET \
    --url 'https://sonarcloud.io/api/issues/search?componentKeys=elice365_elice-next&rules=typescript:S3776,typescript:S3358' \
    --header 'Authorization: Bearer YOUR_TOKEN'

  📅 상태/날짜별 조회

  # Open 상태 이슈만
  curl --request GET \
    --url 'https://sonarcloud.io/api/issues/search?componentKeys=elice365_elice-next&statuses=OPEN' \
    --header 'Authorization: Bearer YOUR_TOKEN'

  # 최근 생성된 이슈들
  curl --request GET \
    --url 'https://sonarcloud.io/api/issues/search?componentKeys=elice365_elice-next&createdAfter=2025-08-01' \
    --header 'Authorization: Bearer YOUR_TOKEN'

  🎯 타입별 조회

  # Code Smell만
  curl --request GET \
    --url 'https://sonarcloud.io/api/issues/search?componentKeys=elice365_elice-next&types=CODE_SMELL' \
    --header 'Authorization: Bearer YOUR_TOKEN'

  # Bug만
  curl --request GET \
    --url 'https://sonarcloud.io/api/issues/search?componentKeys=elice365_elice-next&types=BUG' \
    --header 'Authorization: Bearer YOUR_TOKEN'

  📊 요약 정보 조회

  # 프로젝트 품질 게이트 상태
  curl --request GET \
    --url 'https://sonarcloud.io/api/qualitygates/project_status?projectKey=elice365_elice-next' \
    --header 'Authorization: Bearer YOUR_TOKEN'

  # 메트릭 정보
  curl --request GET \
    --url 'https://sonarcloud.io/api/measures/component?component=elice365_elice-next&metricKeys=bugs,vulnerabilities,code_smells,coverage,duplicated_lines_density' \
    --header 'Authorization: Bearer YOUR_TOKEN'

  🔧 유용한 매개변수

  # 모든 매개변수 조합 예시
  curl --request GET \
    --url 'https://sonarcloud.io/api/issues/search?componentKeys=elice365_elice-next&severities=CRITICAL,MAJOR&types=CODE_SMELL&statuses=OPEN&ps=100&p=1&facets=severities,types,rules' \
    --header 'Authorization: Bearer YOUR_TOKEN'
