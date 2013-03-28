ExttestToJasmineConverter
=========================

Simple project to convert my old Ext.Test with YUI unit tests into Jasmine unit tests.

Ext.Test was a good harness for a while, but with larger and larger projects, it was getting harder to figure out exactly where errors were occurring. Also, Jasmine's syntax is just shorter and more readable. And with its ability to show a stack trace of where assertion errors have occurred, it removes most of the need for writing an error message with each assertion, as was required with YUI Test (thus saving a lot of time). Plus, comments suffice where extra information is needed in this case anyway.

This project probably won't help anyone other than [Aidan](https://github.com/afeld) and I, but oh well :)


Some Notes:

1. Remove Suite-level (not TestCase level) setUp() / tearDown() methods. Parser doesn't handle these, and most are empty anyway.
   You'll get a parse error to know which ones need to be removed.
   
2. There is an issue if a setUp(), tearDown(), or a test defines a subclass, and uses the `this` reference inside it.
   These will be changed to `thisSuite`, and may need to be changed back (to refer to the subclass instance, not the 
   suite fixture).