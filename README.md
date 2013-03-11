ExttestToJasmineConverter
=========================

Simple project to convert my old Ext.Test with YUI unit tests into Jasmine unit tests.

Ext.Test was a good harness for a long while, but with larger and larger projects, it was getting harder and harder to 
figure out exactly where errors were occurring. Also, Jasmine's syntax is just shorter and more readable, and with its 
ability to show a stack trace of where assertion errors have occurred, it removes most of the need for writing an error 
message with each assertion, as was required with YUI Test. Plus comments suffice where extra information is needed in 
this case.

This project probably won't help anyone other than [Aidan](https://github.com/afeld) and I, but who knows!