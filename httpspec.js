// Change to the location of your webdriverjs module.
var webdriver =
  require('/Users/ralphj/selenium/selenium-read-only/build/javascript/node/webdriver');
var protractar = require('./protractar.js');
var assert = require('assert');
var util = require('util');

var driver = new webdriver.Builder().
    usingServer('http://localhost:4444/wd/hub').
    withCapabilities({
      'browserName': 'chrome',
      'version': '',
      'platform': 'ANY',
      'javascriptEnabled': true
    }).build();

var ptar = protractar.wrapDriver(driver);

driver.manage().timeouts().setScriptTimeout(10000);

// A module to override the 'version' service. 
var mockModuleA = function() {
  var jModule = angular.module('jModule', []);
  jModule.value('version', '98.6');
};

// A second module overriding the 'version' service. 
// This module shows the use of a string for the load
// function.
// TODO(julie): Consider this syntax. Should we allow loading the
// modules from files? Provide helpers?
var mockModuleB =
  "angular.module('module2', []).value('version', '5');";

ptar.addMockModule('jModule', mockModuleA);
ptar.addMockModule('module2', mockModuleB);

// The value of version will be '5' because mockModuleB is loaded last.
ptar.get('http://localhost:8000/app/index.html');

// Could still use driver.get to get a URL normally, without injecting modules.

var sample1Button = driver.findElement(webdriver.By.id('sample1'));
var sample2Button = driver.findElement(webdriver.By.id('sample2'));
sample1Button.click();

var fetchButton = driver.findElement(webdriver.By.id('fetch'));
fetchButton.click();


// The quick RPC works fine.
ptar.findElement(webdriver.By.id('statuscode')).getText().then(function(text) {
  assert.equal('200', text);
});
// This does the same thing but doesn't require an ID.
var status = ptar.findElement(protractar.By.binding(), '{{status}}');
status.getText().then(function(text) {
  assert.equal('200', text);
});
ptar.findElement(protractar.By.binding(), "{{data}}").getText().then(function(text) {
  assert.equal('done', text);
});

// Slow RPC.
sample2Button.click();
fetchButton.click();
// Would normally need driver.sleep(2) or something.
ptar.findElement(webdriver.By.id('statuscode')).getText().then(function(text) {
  assert.equal('200', text);
});
ptar.findElement(webdriver.By.id('data')).getText().then(function(text) {
  assert.equal('finally done', text);
});

driver.get('http://www.google.com'); // need to navigate away from an Angular page so that it will
                                     // bootstrap again.

ptar.get('http://localhost:8000/app/index.html#/bindings');

driver.quit();
