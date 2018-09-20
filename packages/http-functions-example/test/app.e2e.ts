import * as puppeteer from 'puppeteer';
import { expect } from 'chai';

describe('http-functions-example', () => {
  let browser, server;

  before(async function() {
    process.env.PORT = String(4000 + Math.floor(Math.random() * 100));
    server = require('../index');
    browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  });

  after(function() {
    server.close();
    browser.close();
  });

  it('should display the signed message', async () => {
    const page = await browser.newPage();
    await page.goto(`http://localhost:${process.env.PORT}/`);
    await page.type('#message', 'the message');
    await page.click('#sign');
    await page.waitFor('#signature');
    expect(await page.$eval('#signature', e => e.innerText)).to.eql(
      'bdfa78b6089865cbc03bc6bb13dc9ed2a5a2aa928d49b38baa85b12c65c4d09e',
    );
  });

  it('should display the console logs', async () => {
    const logs = [];
    const page = await browser.newPage();
    await page.goto(`http://localhost:${process.env.PORT}/`);
    page.on('console', msg => logs.push(msg.text()));
    await page.click('#sign');
    await page.waitFor('#signature');
    expect(logs).to.eql([
      'http function signature.web/sign',
      // [
      //   `┌─────────┬─────┬─────┐`,
      //   `│ (index) │  a  │  b  │`,
      //   `├─────────┼─────┼─────┤`,
      //   `│    0    │  1  │ 'Y' │`,
      //   `│    1    │ 'Z' │  2  │`,
      //   `└─────────┴─────┴─────┘`,
      // ].join('\n'),
      [
        `%c{ a: { b: { c: [ %c1%c, %c2%c, %c3%c ] }, d: %c'a'%c } } `,
        ` color:rgba(204,102,0,1); `,
        ` color:rgba(204,102,0,1); `,
        ` color:rgba(204,102,0,1); `,
        ` color:rgba(0,204,0,1); `,
      ].join(''),
      'console.groupEnd',
    ]);
  });
});
