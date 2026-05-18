// scripts/smoke-test.js

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const COURSE_ID = process.env.SMOKE_COURSE_ID || '83';

const routes = [
    {
        name: 'Home page',
        path: '/',
        expectedStatuses: [200]
    },
    {
        name: 'Course search page',
        path: '/courses/search',
        expectedStatuses: [200]
    },
    {
        name: 'Course detail page',
        path: `/courses/${COURSE_ID}`,
        expectedStatuses: [200]
    },
    {
        name: 'Course preview page',
        path: `/courses/${COURSE_ID}/preview`,
        expectedStatuses: [200, 302]
    },
    {
        name: 'Health check',
        path: '/healthz',
        expectedStatuses: [200],
        expectJson: true
    },
    {
        name: 'Readiness check',
        path: '/readyz',
        expectedStatuses: [200],
        expectJson: true
    }
];

async function checkRoute(route) {
    const url = `${BASE_URL}${route.path}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            redirect: 'manual'
        });

        const contentType = response.headers.get('content-type') || '';
        const passedStatus = route.expectedStatuses.includes(response.status);

        if (!passedStatus) {
            return {
                name: route.name,
                url,
                passed: false,
                status: response.status,
                reason: `Expected status ${route.expectedStatuses.join(' or ')}, got ${response.status}`
            };
        }

        if (route.expectJson && !contentType.includes('application/json')) {
            return {
                name: route.name,
                url,
                passed: false,
                status: response.status,
                reason: `Expected JSON response, got Content-Type: ${contentType}`
            };
        }

        return {
            name: route.name,
            url,
            passed: true,
            status: response.status
        };
    } catch (error) {
        return {
            name: route.name,
            url,
            passed: false,
            status: null,
            reason: error.message
        };
    }
}

async function runSmokeTest() {
    console.log('Running smoke tests...');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Course ID: ${COURSE_ID}`);
    console.log('');

    const results = [];

    for (const route of routes) {
        const result = await checkRoute(route);
        results.push(result);

        if (result.passed) {
            console.log(`[PASS] ${result.name} -> ${result.status} ${result.url}`);
        } else {
            console.log(`[FAIL] ${result.name} -> ${result.status ?? 'NO_RESPONSE'} ${result.url}`);
            console.log(`       Reason: ${result.reason}`);
        }
    }

    const failed = results.filter((result) => !result.passed);

    console.log('');
    console.log(`Smoke test summary: ${results.length - failed.length}/${results.length} passed`);

    if (failed.length > 0) {
        process.exit(1);
    }

    process.exit(0);
}

runSmokeTest();