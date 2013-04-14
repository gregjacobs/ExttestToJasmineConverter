ExttestToJasmineConverter
=========================

Simple project to convert my old Ext.Test with YUI unit tests into Jasmine unit tests.

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


### Some Notes:

1. Remove Suite-level (not TestCase level) setUp() / tearDown() methods. The parser doesn't handle these, and most are 
   empty anyway. You'll get a parse error to know which ones need to be removed.
   
2. The converter converts local `this` references to `thisSuite`, to continue to refer to the suite's fixture (which
   is generated as `thisSuite`). However there is an issue if a test defines a subclass in a local variable, and it uses the 
   `this` reference to refer to itself. These will be incorrectly changed to `thisSuite`, and will need to be changed back 
   (to refer to the subclass instance, not the suite's fixture).
   
   Notable examples of this are the `get()` and `set()` methods in Kevlar's Model class tests. Basically find/replace 
   `thisSuite.get` to `this.get`, and `thisSuite.set` to `this.set`.
   
3. The converter does not rewrite asynchronous tests. There are only a few async tests as far as I remember. These tests
   use YUI Test's wait() method. Just look for `.wait` and rewrite them to use Jasmine's async features (or Jasmine's clock
   mocking features to make the tests synchronous where possible).

4. Every Suite and TestCase (the container that holds the individual tests) must have a `name` property at the top. I may
   not have this in some test files. Notable examples that may not have the `name` property are the integration tests in 
   Kevlar, where I added an extra level of nesting where I didn't need to. Add a `name` property to these. You'll get parse
   errors where they're missing.
   
All in all, this project should get you about 98% of the way there, and then you'll just have to make a few manual adjustments
to get your new Jasmine tests working correctly.