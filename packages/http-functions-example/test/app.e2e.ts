import * as puppeteer from 'puppeteer';
import { expect } from 'chai';

describe('http-functions-example', () => {
  let browser, server;

  before(async function() {
    process.env.PORT = String(4000 + Math.floor(Math.random() * 100));
    server = require('../index');
    browser = await puppeteer.launch();
  });

  after(function() {
    server.close();
    browser.close();
  });

  it('should display counter', async () => {
    const page = await browser.newPage();
    await page.goto(`http://localhost:${process.env.PORT}/`);
    await page.type('#message', 'the message');
    await page.click('#sign');
    expect(await page.$eval('#signature', e => e.innerText)).to.eql(
      'bdfa78b6089865cbc03bc6bb13dc9ed2a5a2aa928d49b38baa85b12c65c4d09e',
    );
  });
});
