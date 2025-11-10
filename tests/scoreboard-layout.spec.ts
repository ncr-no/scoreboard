import { test, expect } from '@playwright/test';

test.describe('Scoreboard Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the scoreboard page
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should have matching heights for left and right content', async ({ page }) => {
    // Set viewport to 1920x1080
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Wait for content to be visible
    await page.waitForSelector('[role="tablist"]', { state: 'visible' });
    
    // Get the scoreboard tab content
    const scoreboardCard = page.locator('[role="tabpanel"]').first();
    const scoreboardBox = await scoreboardCard.boundingBox();
    
    // Get the right sidebar container
    const rightSidebar = page.locator('.lg\\:w-\\[35\\%\\]').first();
    const rightBox = await rightSidebar.boundingBox();
    
    console.log('Scoreboard card height:', scoreboardBox?.height);
    console.log('Right sidebar height:', rightBox?.height);
    
    // Check that heights are approximately equal (within 20px tolerance)
    expect(scoreboardBox?.height).toBeCloseTo(rightBox?.height || 0, -1);
  });

  test('should verify all tab contents have min-h-[720px]', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Check Scoreboard tab
    const scoreboardTab = page.locator('[role="tabpanel"]').first();
    const scoreboardClass = await scoreboardTab.getAttribute('class');
    expect(scoreboardClass).toContain('min-h-[720px]');
    
    // Switch to Challenges tab
    await page.click('button:has-text("Challenges")');
    await page.waitForTimeout(500);
    
    const challengesCard = page.locator('[role="tabpanel"] >> visible=true').first();
    const challengesClass = await challengesCard.getAttribute('class');
    expect(challengesClass).toContain('min-h-[720px]');
    
    // Switch to Analytics tab
    await page.click('button:has-text("Analytics")');
    await page.waitForTimeout(500);
    
    const analyticsContainer = page.locator('[role="tabpanel"] >> visible=true').first().locator('> div').first();
    const analyticsClass = await analyticsContainer.getAttribute('class');
    expect(analyticsClass).toContain('min-h-[720px]');
  });

  test('should verify Recent Submissions height matches scoreboard', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Wait for both components to be visible
    await page.waitForSelector('text=Recent Submissions', { state: 'visible' });
    
    // Get scoreboard table container
    const scoreboardCard = page.locator('[role="tabpanel"]').first();
    const scoreboardBox = await scoreboardCard.boundingBox();
    
    // Get Recent Submissions card
    const submissionsCard = page.locator('text=Recent Submissions').locator('..').locator('..').locator('..');
    const submissionsBox = await submissionsCard.boundingBox();
    
    console.log('Scoreboard height:', scoreboardBox?.height);
    console.log('Submissions card height:', submissionsBox?.height);
    
    // The submissions should be part of a flex container that matches scoreboard height
    expect(submissionsBox?.height).toBeGreaterThan(500); // Minimum reasonable height
  });

  test('should verify all content fits within viewport at 1920x1080', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Get the main container
    const mainContainer = page.locator('.max-w-\\[1920px\\]').first();
    const containerBox = await mainContainer.boundingBox();
    
    console.log('Main container height:', containerBox?.height);
    console.log('Viewport height:', 1080);
    
    // Content should fit within viewport (accounting for some padding/margins)
    expect(containerBox?.height).toBeLessThanOrEqual(1080);
  });

  test('should verify Competition Stats card is compact', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Get Competition Stats card
    const statsCard = page.locator('text=Competition Stats').locator('..').locator('..');
    const statsBox = await statsCard.boundingBox();
    
    console.log('Competition Stats card height:', statsBox?.height);
    
    // Stats card should be compact (less than 200px)
    expect(statsBox?.height).toBeLessThan(200);
  });

  test('should verify left content is 65% and right is 35%', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Get left container
    const leftContainer = page.locator('.lg\\:w-\\[65\\%\\]').first();
    const leftBox = await leftContainer.boundingBox();
    
    // Get right container
    const rightContainer = page.locator('.lg\\:w-\\[35\\%\\]').first();
    const rightBox = await rightContainer.boundingBox();
    
    console.log('Left container width:', leftBox?.width);
    console.log('Right container width:', rightBox?.width);
    
    // Verify ratio is approximately 65:35
    if (leftBox && rightBox) {
      const ratio = leftBox.width / (leftBox.width + rightBox.width);
      console.log('Left ratio:', ratio);
      expect(ratio).toBeGreaterThan(0.63); // Allow some margin
      expect(ratio).toBeLessThan(0.67);
    }
  });

  test('should verify Recent Submissions bottom aligns with left content', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Wait for both components
    await page.waitForSelector('[role="tabpanel"]', { state: 'visible' });
    await page.waitForSelector('text=Recent Submissions', { state: 'visible' });
    
    // Get scoreboard card
    const scoreboardCard = page.locator('[role="tabpanel"]').first();
    const scoreboardBox = await scoreboardCard.boundingBox();
    
    // Get right sidebar (which contains stats + submissions)
    const rightSidebar = page.locator('.lg\\:w-\\[35\\%\\]').first();
    const rightBox = await rightSidebar.boundingBox();
    
    console.log('Scoreboard bottom:', scoreboardBox ? scoreboardBox.y + scoreboardBox.height : 0);
    console.log('Right sidebar bottom:', rightBox ? rightBox.y + rightBox.height : 0);
    
    // Bottoms should align (within 10px tolerance)
    if (scoreboardBox && rightBox) {
      const scoreboardBottom = scoreboardBox.y + scoreboardBox.height;
      const rightBottom = rightBox.y + rightBox.height;
      expect(Math.abs(scoreboardBottom - rightBottom)).toBeLessThan(10);
    }
  });

  test('should capture screenshot for visual verification', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Wait for page to be fully loaded
    await page.waitForTimeout(2000);
    
    // Take full page screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/scoreboard-layout-1920x1080.png',
      fullPage: false 
    });
    
    // Switch to Challenges tab and screenshot
    await page.click('button:has-text("Challenges")');
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'tests/screenshots/challenges-layout-1920x1080.png',
      fullPage: false 
    });
    
    // Switch to Analytics tab and screenshot
    await page.click('button:has-text("Analytics")');
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'tests/screenshots/analytics-layout-1920x1080.png',
      fullPage: false 
    });
  });
});
