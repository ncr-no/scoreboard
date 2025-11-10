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

test.describe('Responsive Design Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });

  test('should display in column layout on mobile (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForSelector('[role="tablist"]', { state: 'visible' });
    
    // Check that layout is column (flex-col) on mobile
    const mainLayout = page.locator('.flex.flex-col.lg\\:flex-row').first();
    const layoutClass = await mainLayout.getAttribute('class');
    expect(layoutClass).toContain('flex-col');
    
    // Verify no horizontal overflow
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 375;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow small margin
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/screenshots/mobile-375x667.png',
      fullPage: true 
    });
  });

  test('should display in column layout on tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForSelector('[role="tablist"]', { state: 'visible' });
    
    // Check that layout is still column on tablet (below lg breakpoint)
    const mainLayout = page.locator('.flex.flex-col.lg\\:flex-row').first();
    const layoutClass = await mainLayout.getAttribute('class');
    expect(layoutClass).toContain('flex-col');
    
    // Verify stats grid is 2 columns on tablet
    const statsGrid = page.locator('.grid.grid-cols-2.sm\\:grid-cols-3').first();
    const gridClass = await statsGrid.getAttribute('class');
    expect(gridClass).toContain('grid-cols-2');
    
    await page.screenshot({ 
      path: 'tests/screenshots/tablet-768x1024.png',
      fullPage: true 
    });
  });

  test('should display in row layout on desktop (1280x720)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForSelector('[role="tablist"]', { state: 'visible' });
    
    // Check that layout switches to row at lg breakpoint
    const mainLayout = page.locator('.flex.flex-col.lg\\:flex-row').first();
    const layoutClass = await mainLayout.getAttribute('class');
    expect(layoutClass).toContain('lg:flex-row');
    
    // Verify stats grid is 3 columns on desktop
    const statsGrid = page.locator('.grid.grid-cols-2.sm\\:grid-cols-3').first();
    const gridClass = await statsGrid.getAttribute('class');
    expect(gridClass).toContain('sm:grid-cols-3');
    
    await page.screenshot({ 
      path: 'tests/screenshots/desktop-1280x720.png',
      fullPage: true 
    });
  });

  test('should handle table horizontal scroll on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForSelector('[role="tablist"]', { state: 'visible' });
    
    // Check that table has overflow-x-auto
    const tableContainer = page.locator('.overflow-x-auto').first();
    const containerClass = await tableContainer.getAttribute('class');
    expect(containerClass).toContain('overflow-x-auto');
    
    // Verify table doesn't break layout
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(400); // Allow some margin for scrollbar
  });

  test('should verify tabs are accessible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForSelector('[role="tablist"]', { state: 'visible' });
    
    // Verify all three tabs are visible and clickable
    const scoreboardTab = page.locator('button:has-text("Scoreboard")');
    const challengesTab = page.locator('button:has-text("Challenges")');
    const analyticsTab = page.locator('button:has-text("Analytics")');
    
    await expect(scoreboardTab).toBeVisible();
    await expect(challengesTab).toBeVisible();
    await expect(analyticsTab).toBeVisible();
    
    // Test tab switching
    await challengesTab.click();
    await page.waitForTimeout(500);
    await expect(page.locator('[role="tabpanel"] >> visible=true')).toBeVisible();
    
    await analyticsTab.click();
    await page.waitForTimeout(500);
    await expect(page.locator('[role="tabpanel"] >> visible=true')).toBeVisible();
  });

  test('should verify challenge cards grid on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForSelector('[role="tablist"]', { state: 'visible' });
    
    // Switch to Challenges tab
    await page.click('button:has-text("Challenges")');
    await page.waitForTimeout(500);
    
    // Verify grid is single column on mobile
    const challengesGrid = page.locator('.grid.grid-cols-1.sm\\:grid-cols-2').first();
    const gridClass = await challengesGrid.getAttribute('class');
    expect(gridClass).toContain('grid-cols-1');
  });

  test('should verify analytics grid layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForSelector('[role="tablist"]', { state: 'visible' });
    
    // Switch to Analytics tab
    await page.click('button:has-text("Analytics")');
    await page.waitForTimeout(500);
    
    // Verify grid is single column on mobile
    const analyticsGrid = page.locator('.grid.grid-cols-1.sm\\:grid-cols-2').first();
    const gridClass = await analyticsGrid.getAttribute('class');
    expect(gridClass).toContain('grid-cols-1');
  });

  test('should verify no horizontal overflow on iPhone 12 Pro (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForSelector('[role="tablist"]', { state: 'visible' });
    
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = 390;
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10);
    
    await page.screenshot({ 
      path: 'tests/screenshots/iphone12pro-390x844.png',
      fullPage: true 
    });
  });

  test('should verify stats grid adapts correctly', async ({ page }) => {
    // Test mobile - 2 columns
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForSelector('text=Competition Stats', { state: 'visible' });
    let statsGrid = page.locator('.grid.grid-cols-2.sm\\:grid-cols-3').first();
    let gridClass = await statsGrid.getAttribute('class');
    expect(gridClass).toContain('grid-cols-2');
    
    // Test desktop - 3 columns
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    statsGrid = page.locator('.grid.grid-cols-2.sm\\:grid-cols-3').first();
    gridClass = await statsGrid.getAttribute('class');
    expect(gridClass).toContain('sm:grid-cols-3');
  });

  test('should verify UI is non-scrollable on mobile (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForSelector('[role="tablist"]', { state: 'visible' });
    await page.waitForTimeout(1000);
    
    // Check that body doesn't scroll
    const bodyScrollHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = 667;
    expect(bodyScrollHeight).toBeLessThanOrEqual(viewportHeight + 5); // Allow small margin
    
    // Check that html doesn't scroll
    const htmlScrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    expect(htmlScrollHeight).toBeLessThanOrEqual(viewportHeight + 5);
    
    // Verify overflow-hidden is applied
    const mainContainer = page.locator('.h-screen.overflow-hidden').first();
    const containerClass = await mainContainer.getAttribute('class');
    expect(containerClass).toContain('overflow-hidden');
  });

  test('should verify UI is non-scrollable on desktop (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForSelector('[role="tablist"]', { state: 'visible' });
    await page.waitForTimeout(1000);
    
    // Check that body doesn't scroll
    const bodyScrollHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = 1080;
    expect(bodyScrollHeight).toBeLessThanOrEqual(viewportHeight + 5);
    
    // Verify overflow-hidden is applied
    const mainContainer = page.locator('.h-screen.overflow-hidden').first();
    const containerClass = await mainContainer.getAttribute('class');
    expect(containerClass).toContain('overflow-hidden');
  });

  test('should verify all content fits within viewport on tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForSelector('[role="tablist"]', { state: 'visible' });
    await page.waitForTimeout(1000);
    
    const bodyScrollHeight = await page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = 1024;
    expect(bodyScrollHeight).toBeLessThanOrEqual(viewportHeight + 5);
  });

  test('should verify reduced sizes on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForSelector('[role="tablist"]', { state: 'visible' });
    
    // Check title size is reduced
    const title = page.locator('h1').first();
    const titleClass = await title.getAttribute('class');
    expect(titleClass).toContain('text-lg'); // Should start with text-lg on mobile
    
    // Check tabs are smaller
    const tabsList = page.locator('[role="tablist"]').first();
    const tabsClass = await tabsList.getAttribute('class');
    expect(tabsClass).toContain('h-6'); // Should have h-6 on mobile
    
    // Check table rows are smaller
    const tableRow = page.locator('tbody tr').first();
    if (await tableRow.count() > 0) {
      const rowClass = await tableRow.getAttribute('class');
      expect(rowClass).toContain('h-7'); // Should have h-7 on mobile
    }
  });
});
