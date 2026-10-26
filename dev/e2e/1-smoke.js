const {start,newPage,shot}=require('./harness.js');
const assert=require('assert');
(async()=>{
  const {gas,web,browser}=await start();
  // setup + temp password
  const setup=await (await fetch('http://localhost:8787/__setup')).json();
  const temp=(setup.r.match(/: (\S{10})\n/)||[])[1]; console.log('temp',temp);
  const {page,errors}=await newPage(browser);
  await page.goto('http://localhost:8788/');
  await page.waitForSelector('#srvin');
  await shot(page,'01-server');
  await page.fill('#srvin','https://script.google.com/macros/s/TEST/exec'); await page.click('#srvgo');
  await page.waitForSelector('.empty'); await shot(page,'02-guest-empty');
  // login
  await page.click('#btnAuth'); await page.fill('#pw',temp); await page.click('#go');
  await page.waitForSelector('#fc_old'); await shot(page,'03-force');
  await page.fill('#fc_old',temp); await page.fill('#fc_new','Secret123'); await page.fill('#fc_new2','Secret123'); await page.click('#fc_go');
  await page.waitForSelector('#w_name'); await shot(page,'04-welcome');
  await page.fill('#w_name','كُنّاشة تجريبية'); await page.fill('#w_by','صديق'); await page.click('#w_go');
  await page.waitForSelector('#fab',{state:'visible'}); await shot(page,'05-owner-empty');
  // add fact with shortcuts
  await page.click('#fab'); await page.fill('#f_text','فالاعتصام بالله والتوكل عليه هو العمدة في الهداية، والعدة في مباعدة الغواية، والوسيلة إلى الرشاد، وطريق السداد وحصول المراد. #التفسير @ابن_كثير [تفسير ابن كثير 2/388] ~ابن جرير !');
  await shot(page,'06-editor'); await page.click('#save');
  await page.waitForSelector('.card'); await shot(page,'07-list');
  console.log('errors',errors);
  await browser.close(); gas.srv.close(); web.close();
  if(errors.length) process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
