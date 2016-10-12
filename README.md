ExttestToJasmineConverter
=========================

(Somewhat) Simple project to convert my old Ext.Test with [YUI](http://yuilibrary.com/yui/docs/test/) unit tests into 
[Jasmine](https://jasmine.github.io/) unit tests.

Ext.Test was a good harness for a while, but with larger and larger projects, it was getting harder to figure out exactly 
where errors were occurring. Also, Jasmine's syntax is just shorter and more readable. And with its ability to show a stack 
trace of where assertion errors have occurred, it removes most of the need for writing an error message with each assertion, 
as was required with YUI Test (thus saving a lot of time). Plus, comments suffice where extra information is needed in this 
case anyway.

This project probably won't help anyone other than [Aidan](https://github.com/afeld) and I, but oh well :)


### Usage

Help output:

    node convert.js -h


Basic usage:

    node convert.js inputFile [outputFile]
    
    or
    
    node convert.js inputDir outputDir


Mapping files:

    node convert.js --inputMask=*Test.js --outputMask=*Spec.js test/ spec/
    
    // all *Test.js files in the `test/` directory are output to the `spec/` directory as *Spec.js, 
    // where the * in the outputMask is replaced with the matched text of the * in the inputMask.


### Some Notes / Steps:

Here are some things you'll need to do to get everything converted. It may look like a lot of steps, but it's not that bad. Shouldn't take you more than an hour or two, and totally worth it. Just keep running the converter on the tests directory, fixing anything that comes up, until it converts everything successfully.

#### To get parsing/converting working properly:

1. **Quick Fixes**: The parser/converter won't convert things exactly as-is. The converter itself is a mixture of a recursive descent parser and 
   regular expression search/replacement of the high-level Ext.Test / YUI Test constructs (but not of JavaScript itself). So, 
   some things need to be fixed beforehand and as you go along (as outlined below). Here a few quick fixes to start which 
   mess things up that I found when running it on the Jux tests (at least the ones I've had since last July):
   - Remove the comment in ui/ContainerTest.js, line ~157 which has: `// Note: for some reason, Y.Assert.isInstanceOf() is screwing up the test harness` ...

1. **Non-Ext.Test files**: The converter won't process files that aren't Ext.Test files. You will have to either remove the 
   `suites.js` files, or rename them to have another extension while you use the `--inputMask=*.js` arg.

1. **Suite/TestCase `name` property**: Every Suite and TestCase (the container that holds the individual tests) must have a 
   `name` property at the top. I may not have this in some test files. Some examples that may not have the `name` property 
   are the integration tests in Kevlar, where I added an extra level of nesting where I didn't need to. Add a `name` property
   to these. You'll get parse errors where they're missing.
   
   Fix the following in particular: 
   - app/models/VideoTest.js (just delete this file if there are still no tests for it)
   - ui/ComponentTest.js (`bubble()` testcase needs a name property, for instance: `name : "Test bubble()"`)

1. **Suite-level setUp/tearDown**: Remove Suite-level (not TestCase level) setUp() / tearDown() methods. The parser doesn't 
   handle these, and most are empty anyway. You'll get a parse error to know which ones need to be removed.
   
   For the ones that actually do something, just copy/paste the code in the suite-level setUp() / tearDown() methods in place
   of where the child TestCases call `this.getParentSuite()`
   
   Fix the following in particular: 
   - app/components/mediaPicker/thumbnailsContainer/ThumbnailsContainerTest.js (copy contents of Suite-level setUp method into each TestCase setUp method, overwriting what is in each TestCase-level setUp method. Then remove Suite-level setUp method)
   - app/routers/Test_Gallery.js (cut and paste contents of Suite-level setUp method over the first line of the TestCase-level setUp method, and then remove the Suite-level setUp/tearDown methods)
   - ui/ContainerTest.js (just remove empty suite-level `setUp()`)
   - ui/formFields/TextAreaFieldTest.js (just remove empty suite-level `setUp()`)
   - ui/formFields/TextFieldTest.js (just remove empty suite-level `setUp()`)
   - ui/layout/TabsLayoutTest.js (just remove empty suite-level `setUp()`)

1. **'defaults' property in Suite**: Occassionally used Ext's `defaults` property in test suites to copy setUp/tearDown methods 
   to each child TestCase. Remove this property, and just copy and paste the setUp/tearDown manually.
   
   Fix the following in particular:
   - app/components/controls/PictureSelectorTest.js (copy the setUp/tearDown methods into each TestCase, and remove the `defaults` property)
   - app/views/quark/streetview/DesktopStreetviewTest.js (cut and paste the setUp method into each TestCase, and remove the `defaults` property)
   - app/views/quark/streetview/StreetviewTest.js (just delete this file if it still doesn't have any tests)


#### To get tests working properly (after conversion):

1. **'this' reference conversions**: The converter converts local `this` references to `thisSuite`, to continue to refer to 
   the suite's fixture (which is generated as `thisSuite`). However there is an issue if a test defines a subclass in a local 
   variable, and it uses the `this` reference to refer to itself. These will be incorrectly changed to `thisSuite`, and will 
   need to be changed back (to refer to the subclass instance, not the suite's fixture).
   
   Notable examples of this are the `get()` and `set()` methods in Kevlar's Model class tests. Basically find/replace 
   `thisSuite.get` to `this.get`, and `thisSuite.set` to `this.set`.

1. **Ext.test.Case class**: You'll have to create and include a simple `Ext.test.Case` (and possibly an `Ext.test.TestCase`) 
   class, which just has empty `setUp` and `tearDown` methods. This is because some test files extend this class for creating 
   their fixture. So just add this as a temporary thing so you don't have to include all of the YUI and Ext.Test files in your 
   Jasmine harness.
   
   This should do the trick right inside the Jasmine html file, before including your tests:
   ```javascript
   var Ext = { test: {} };
   Ext.test.Case = Ext.test.TestCase = Class.extend( Object, {
       setUp    : function() {},
       tearDown : function() {}
   } );
   ```

1. **Async Tests**: The converter does not rewrite asynchronous tests. There are only a few async tests though as far as I remember. 
   These tests use YUI Test's `wait()` method. Just look for `.wait` and `.resume`, and rewrite them to use Jasmine's async 
   features (or Jasmine's clock mocking features to make the tests synchronous where possible).


All in all, this converter should get you about 96-97% of the way there, and then you'll just have to make a few manual 
adjustments to get the Jasmine tests working correctly. 
