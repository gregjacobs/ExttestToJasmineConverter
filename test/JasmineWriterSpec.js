/*global require, describe, beforeEach, afterEach, it */
var expect = require( 'chai' ).expect,
    JasmineWriter    = require( '../src/JasmineWriter' ),
    SuiteNode        = require( '../src/node/Suite' ),
    TestCaseNode     = require( '../src/node/TestCase' ),
    DiTestCaseNode   = require( '../src/node/DiTestCase' ),
    ShouldNode       = require( '../src/node/Should' ),
    SetUpNode        = require( '../src/node/SetUp' ),
    TearDownNode     = require( '../src/node/TearDown' ),
    TestNode         = require( '../src/node/Test' ),
    HelperMethodNode = require( '../src/node/HelperMethod' );

describe( 'node.JasmineWriter', function() {
	
	describe( 'write()', function() {
		
		it( "should write the output of a Suite node", function() {
			var jasmineWriter = new JasmineWriter();
			
			var suiteNode = new SuiteNode( "My Suite", [] );
			
			var output = jasmineWriter.write( suiteNode );
			expect( output ).to.equal( [
				'describe( "My Suite", function() {',
				'} );'
			].join( "\n" ) );
		} );
		
		
		it( "should write the output of a TestCase node", function() {
			var jasmineWriter = new JasmineWriter();
			
			var testCaseNode = new TestCaseNode(
				"My Test Case",
				null,  // should
				null,  // setUp
				null,  // tearDown
				[],    // tests
				[]     // helper methods
			);
			var output = jasmineWriter.write( testCaseNode );
			
			expect( output ).to.equal( [
				'describe( "My Test Case", function() {',
				'} );'
			].join( "\n" ) );
		} );
		
		
		it( "should throw an error if a Suite or TestCase node is not passed in as its argument", function() {
			var jasmineWriter = new JasmineWriter();
			
			expect( function() {
				jasmineWriter.write( null );
			} ).to.Throw( "A `Suite` or `TestCase` node was not passed in to write()" );
		} );
		
	} );
	
	
	describe( 'appendOutput()', function() {
		
		it( "should simply push a string to the output buffer when no indent level is set", function() {
			var jasmineWriter = new JasmineWriter(),
			    buffer = [];
			
			jasmineWriter.appendOutput( "Testing 123", buffer );
			expect( buffer.join( '\n' ) ).to.equal( "Testing 123" );
		} );
		
		
		it( "should push a string to the output buffer, with the current level of indent", function() {
			var jasmineWriter = new JasmineWriter( {
				indentStr   : '\t',
				indentLevel : 2
			} );
			var buffer = [];
			
			jasmineWriter.appendOutput( "Testing 123", buffer );
			expect( buffer.join( '\n' ) ).to.equal( "\t\tTesting 123" );
		} );
		
		
		it( "should push a multiline string to the output buffer, with the current level of indent for *each* line provided", function() {
			var jasmineWriter = new JasmineWriter( {
				indentStr   : '\t',
				indentLevel : 2
			} );
			var buffer = [];
			
			jasmineWriter.appendOutput( "Testing\n123", buffer );
			expect( buffer.join( '\n' ) ).to.equal( "\t\tTesting\n\t\t123" );
		} );
		
	} );
	
	
	// ------------------------------------
	
	
	describe( 'appendSuite()', function() {
		
		it( "should create the code for an empty Suite", function() {
			var jasmineWriter = new JasmineWriter( {
				indentStr : '\t'
			} );
			var buffer = [];
			
			var suiteNode = new SuiteNode( "My Suite", [] );
			jasmineWriter.appendSuite( suiteNode, buffer );
			
			expect( buffer.join( '\n' ) ).to.equal( [
				'describe( "My Suite", function() {',
				'} );'
			].join( "\n" ) );
		} );
		
		
		it( "should create the code for when the Suite has child nodes", function() {
			var jasmineWriter = new JasmineWriter( {
				indentStr : '\t'
			} );
			var buffer = [];
			
			var testCaseNode = new TestCaseNode(
				"My Test Case",
				null,  // should
				null,  // setUp
				null,  // tearDown
				[],    // tests
				[]     // helper methods
			);
			
			var nestedSuiteNode = new SuiteNode( "My Nested Suite", [] );
			
			var suiteNode = new SuiteNode( "My Suite", [ testCaseNode, nestedSuiteNode ] );
			jasmineWriter.appendSuite( suiteNode, buffer );
			
			expect( buffer.join( '\n' ) ).to.equal( [
				'describe( "My Suite", function() {',
				'\t',
				'\tdescribe( "My Test Case", function() {',
				'\t} );',
				'\t',
				'\t',
				'\tdescribe( "My Nested Suite", function() {',
				'\t} );',
				'\t',
				'} );'
			].join( "\n" ) );
		} );
		
	} );
	
	
	describe( 'appendTestCase()', function() {
		
		it( "should create the code for an empty TestCase", function() {
			var jasmineWriter = new JasmineWriter( {
				indentStr : '\t'
			} );
			var buffer = [];
			
			var testCaseNode = new TestCaseNode(
				"My Test Case",
				null,  // should
				null,  // setUp
				null,  // tearDown
				[],    // tests
				[]     // helper methods
			);
			jasmineWriter.appendTestCase( testCaseNode, buffer );
			
			expect( buffer.join( '\n' ) ).to.equal( [
				'describe( "My Test Case", function() {',
				'} );'
			].join( "\n" ) );
		} );
		
		
		it( "should create the code for a TestCase with all child entities", function() {
			var jasmineWriter = new JasmineWriter( {
				indentStr : '\t'
			} );
			var buffer = [];
			
			
			var shouldNode = new ShouldNode( 
				{ "something should happen" : true },                 // ignore this test
				{ "something should error" : "error: xyz happened" }  // this test should error
			);
			
			var setUpNode = new SetUpNode( [
				'this.a = 1;',
				'this.b = 2;'
			].join( "\n" ) );
			
			var tearDownNode = new TearDownNode( [
				'this.a.destroy();',
				'this.b.destroy();'
			].join( "\n" ) );
			
			var testNode1 = new TestNode( "something should happen", [
				'var a = 1;',
				'if( b == 2 ) {',
				'\ta = 2;',
				'}'
			].join( "\n" ) );
			
			var testNode2 = new TestNode( "something should error", [
				'var a = 1;',
				'if( b == 2 ) {',
				'\ta = 2;',
				'}'
			].join( "\n" ) );
			
			var testNode3 = new TestNode( "something should REALLY happen", [
				'var a = 1;',
				'if( b == 2 ) {',
				'\ta = 2;',
				'}'
			].join( "\n" ) );
			
			var helperMethodNode1 = new HelperMethodNode( "someHelper", " arg1, arg2 ", [
				'return arg1;'
			].join( "\n" ) );
			
			var helperMethodNode2 = new HelperMethodNode( "someHelper2", " arg1, arg2 ", [
				'return arg2;'
			].join( "\n" ) );
			
			
			var testCaseNode = new TestCaseNode(
				"My Test Case",
				shouldNode,
				setUpNode,
				tearDownNode,
				[ testNode1, testNode2, testNode3 ],
				[ helperMethodNode1, helperMethodNode2 ]
			);
			jasmineWriter.appendTestCase( testCaseNode, buffer );
			
			expect( buffer.join( '\n' ) ).to.equal( [
				'describe( "My Test Case", function() {',
				'\tvar thisSuite;',
				'\t',
				'\tbeforeEach( function() {',
				'\t\tthisSuite = {};',
				'\t\t',
				'\t\tthisSuite.a = 1;',
				'\t\tthisSuite.b = 2;',
				'\t} );',
				'\t',
				'\tafterEach( function() {',
				'\t\tthisSuite.a.destroy();',
				'\t\tthisSuite.b.destroy();',
				'\t} );',
				'\t',
				'\t',
				'\tfunction someHelper( arg1, arg2 ) {',
				'\t\treturn arg1;',
				'\t}',
				'\t',
				'\t',
				'\tfunction someHelper2( arg1, arg2 ) {',
				'\t\treturn arg2;',
				'\t}',
				'\t',
				'\t',
				'\txit( "something should happen", function() {',
				'\t\tvar a = 1;',
				'\t\tif( b == 2 ) {',
				'\t\t\ta = 2;',
				'\t\t}',
				'\t} );',
				'\t',
				'\t',
				'\tit( "something should error", function() {',
				'\t\texpect( function() {',
				'\t\t\tvar a = 1;',
				'\t\t\tif( b == 2 ) {',
				'\t\t\t\ta = 2;',
				'\t\t\t}',
				'\t\t} ).toThrow( "error: xyz happened" );',
				'\t} );',
				'\t',
				'\t',
				'\tit( "something should REALLY happen", function() {',
				'\t\tvar a = 1;',
				'\t\tif( b == 2 ) {',
				'\t\t\ta = 2;',
				'\t\t}',
				'\t} );',
				'\t',
				'} );'
			].join( "\n" ) );
		} );
		
	} );
	
	
	describe( 'appendSetUp()', function() {
		
		it( "should create the code to transform an Ext.Test setUp() method in an anonymous TestCase, converting `this` references to `thisSuite`", function() {
			var jasmineWriter = new JasmineWriter( {
				indentStr : '\t'
			} );
			var buffer = [];
			
			var setUpNode = new SetUpNode( [
				'this.a = 1;',
				'this.b = 2;'
			].join( "\n" ) );
			
			jasmineWriter.appendSetUp( setUpNode, new TestCaseNode(), buffer );
			expect( buffer.join( '\n' ) ).to.equal( [
				'var thisSuite;',
				'',
				'beforeEach( function() {',
				'\tthisSuite = {};',
				'\t',
				'\tthisSuite.a = 1;',
				'\tthisSuite.b = 2;',
				'} );'
			].join( "\n" ) );
		} );
		
		
		it( "should create the code to transform an Ext.Test setUp() method in a 'direct instantiation' TestCase, converting `this` references to `thisSuite`", function() {
			var jasmineWriter = new JasmineWriter( {
				indentStr : '\t'
			} );
			var buffer = [];
			
			var diTestCaseNode = new DiTestCaseNode( "some.package.SomeTest" );
			var setUpNode = new SetUpNode( [
				'this.a = 1;',
				'this.b = 2;'
			].join( "\n" ) );
			
			jasmineWriter.appendSetUp( setUpNode, diTestCaseNode, buffer );
			expect( buffer.join( '\n' ) ).to.equal( [
				'var thisSuite;',
				'',
				'beforeEach( function() {',
				'\tthisSuite = new some.package.SomeTest();',
				'\tthisSuite.setUp();',
				'\t',
				'\tthisSuite.a = 1;',
				'\tthisSuite.b = 2;',
				'} );'
			].join( "\n" ) );
		} );
		
		
		it( "should create the code to transform an Ext.Test setUp() method in a 'direct instantiation' TestCase that calls its superclass method directly", function() {
			var jasmineWriter = new JasmineWriter( {
				indentStr : '\t'
			} );
			var buffer = [];
			
			var diTestCaseNode = new DiTestCaseNode( "some.package.SomeTest" );
			var setUpNode = new SetUpNode( [
				'app.controllers.quark.edit.AbstractSlideshowTest.prototype.setUp.apply( this, arguments );',
				'',
				'this.a = 1;',
				'this.b = 2;'
			].join( "\n" ) );
			
			jasmineWriter.appendSetUp( setUpNode, diTestCaseNode, buffer );
			expect( buffer.join( '\n' ) ).to.equal( [
				'var thisSuite;',
				'',
				'beforeEach( function() {',
				'\tthisSuite = new some.package.SomeTest();',
				'\tthisSuite.setUp();',
				'\t',
				'\tthisSuite.a = 1;',
				'\tthisSuite.b = 2;',
				'} );'
			].join( "\n" ) );
		} );
		
	} );
	
	
	describe( 'appendTearDown()', function() {
		
		it( "should create the code to transform an Ext.Test tearDown() method in an anonymous TestCase, converting `this` references to `thisSuite`", function() {
			var jasmineWriter = new JasmineWriter( {
				indentStr : '\t'
			} );
			var buffer = [];
			
			var tearDownNode = new TearDownNode( [
				'this.a.destroy();',
				'this.b.destroy();'
			].join( "\n" ) );
			
			jasmineWriter.appendTearDown( tearDownNode, new TestCaseNode(), buffer );
			expect( buffer.join( '\n' ) ).to.equal( [
				'afterEach( function() {',
				'\tthisSuite.a.destroy();',
				'\tthisSuite.b.destroy();',
				'} );'
			].join( "\n" ) );
		} );
		
		
		it( "should create the code to transform an Ext.Test tearDown() method in a 'direct instantiation' TestCase, converting `this` references to `thisSuite`", function() {
			var jasmineWriter = new JasmineWriter( {
				indentStr : '\t'
			} );
			var buffer = [];
			
			var diTestCaseNode = new DiTestCaseNode( "some.package.SomeTest" );
			var tearDownNode = new TearDownNode( [
				'this.a.destroy();',
				'this.b.destroy();'
			].join( "\n" ) );
			
			jasmineWriter.appendTearDown( tearDownNode, diTestCaseNode, buffer );
			expect( buffer.join( '\n' ) ).to.equal( [
				'afterEach( function() {',
				'\tthisSuite.a.destroy();',
				'\tthisSuite.b.destroy();',
				'\t',
				'\tthisSuite.tearDown();',
				'} );'
			].join( "\n" ) );
		} );
		
		
		it( "should create the code to transform an Ext.Test tearDown() method in a 'direct instantiation' TestCase that calls its superclass method directly", function() {
			var jasmineWriter = new JasmineWriter( {
				indentStr : '\t'
			} );
			var buffer = [];
			
			var diTestCaseNode = new DiTestCaseNode( "some.package.SomeTest" );
			var tearDownNode = new TearDownNode( [
				'this.a.destroy();',
				'this.b.destroy();',
				'',
				'app.controllers.quark.edit.AbstractSlideshowTest.prototype.tearDown.apply( this, arguments );'
			].join( "\n" ) );
			
			jasmineWriter.appendTearDown( tearDownNode, diTestCaseNode, buffer );
			expect( buffer.join( '\n' ) ).to.equal( [
				'afterEach( function() {',
				'\tthisSuite.a.destroy();',
				'\tthisSuite.b.destroy();',
				'\t',
				'\tthisSuite.tearDown();',
				'} );'
			].join( "\n" ) );
		} );
		
	} );
	
	
	describe( 'appendHelperMethod()', function() {
		
		it( "should create the code to transform a helper method", function() {
			var jasmineWriter = new JasmineWriter( {
				indentStr : '    '  // 4 spaces
			} );
			var buffer = [];
			
			var helperMethodNode = new HelperMethodNode( "someHelper", " arg1, arg2 ", [
				'arg1 = arg1 + arg2 + this.something;',
				'Y.Assert.areSame( arg1, arg2, "should be the same" );'
			].join( "\n" ) );
			
			jasmineWriter.appendHelperMethod( helperMethodNode, buffer );
			expect( buffer.join( '\n' ) ).to.equal( [
				'function someHelper( arg1, arg2 ) {',
				'    arg1 = arg1 + arg2 + thisSuite.something;',
				'    expect( arg2 ).toBe( arg1 );  // orig YUI Test err msg: "should be the same"',
				'}'
			].join( "\n" ) );
		} );
		
	} );
	
	
	describe( 'appendTest()', function() {
		
		it( "should create the code to transform an Ext.Test test method, with no `should` instructions", function() {
			var jasmineWriter = new JasmineWriter( {
				indentStr : '\t'
			} );
			var buffer = [];
			
			var testNode = new TestNode( "something should happen", [
				'var a = 1;',
				'if( b == 2 ) {',
				'\ta = 2;',
				'}'
			].join( "\n" ) );
			
			jasmineWriter.appendTest( testNode, null, [], buffer );
			
			expect( buffer.join( '\n' ) ).to.equal( [
				'it( "something should happen", function() {',
				'\tvar a = 1;',
				'\tif( b == 2 ) {',
				'\t\ta = 2;',
				'\t}',
				'} );'
			].join( "\n" ) );
		} );
		
		
		it( "should create the code to transform an Ext.Test test method, with an ignore `should` instruction ('it' function should become 'xit')", function() {
			var jasmineWriter = new JasmineWriter( {
				indentStr : '\t'
			} );
			var buffer = [];
			
			var shouldNode = new ShouldNode( { "something should happen" : true }, null );
			var testNode = new TestNode( "something should happen", [
				'var a = 1;',
				'if( b == 2 ) {',
				'\ta = 2;',
				'}'
			].join( "\n" ) );
			
			jasmineWriter.appendTest( testNode, shouldNode, [], buffer );
			
			expect( buffer.join( '\n' ) ).to.equal( [
				'xit( "something should happen", function() {',
				'\tvar a = 1;',
				'\tif( b == 2 ) {',
				'\t\ta = 2;',
				'\t}',
				'} );'
			].join( "\n" ) );
		} );
		
		
		it( "should create the code to transform an Ext.Test test method, with a 'should fail' `should` instruction (code body should be wrapped in an expectation to throw an error)", function() {
			var jasmineWriter = new JasmineWriter( {
				indentStr : '\t'
			} );
			var buffer = [];
			
			var shouldNode = new ShouldNode( null, { "something should error" : "error: xyz happened" } );
			var testNode = new TestNode( "something should error", [
				'var a = 1;',
				'if( b == 2 ) {',
				'\ta = 2;',
				'}'
			].join( "\n" ) );
			
			jasmineWriter.appendTest( testNode, shouldNode, [], buffer );
			
			expect( buffer.join( '\n' ) ).to.equal( [
				'it( "something should error", function() {',
				'\texpect( function() {',
				'\t\tvar a = 1;',
				'\t\tif( b == 2 ) {',
				'\t\t\ta = 2;',
				'\t\t}',
				'\t} ).toThrow( "error: xyz happened" );',
				'} );'
			].join( "\n" ) );
		} );
		
		
		it( "should create the code to transform an Ext.Test test method, with both 'ignore' and 'should fail' `should` instructions", function() {
			var jasmineWriter = new JasmineWriter( {
				indentStr : '\t'
			} );
			var buffer = [];
			
			var shouldNode = new ShouldNode( { "something should error" : true }, { "something should error" : "error: xyz happened" } );
			var testNode = new TestNode( "something should error", [
				'var a = 1;',
				'if( b == 2 ) {',
				'\ta = 2;',
				'}'
			].join( "\n" ) );
			
			jasmineWriter.appendTest( testNode, shouldNode, [], buffer );
			
			expect( buffer.join( '\n' ) ).to.equal( [
				'xit( "something should error", function() {',
				'\texpect( function() {',
				'\t\tvar a = 1;',
				'\t\tif( b == 2 ) {',
				'\t\t\ta = 2;',
				'\t\t}',
				'\t} ).toThrow( "error: xyz happened" );',
				'} );'
			].join( "\n" ) );
		} );
		
		
		it( "should create the code to transform an Ext.Test test method, transforming helper method calls", function() {
			var jasmineWriter = new JasmineWriter( {
				indentStr : '\t'
			} );
			var buffer = [];
			
			var testNode = new TestNode( "something should happen", [
				'var a = 1;',
				'if( b == 2 ) {',
				'\ta = this.helperMethod();',
				'}'
			].join( "\n" ) );
			
			var helperMethod = new HelperMethodNode( "helperMethod", "", "" );  // no args list or code body
			jasmineWriter.appendTest( testNode, null, [ helperMethod ], buffer );
			
			expect( buffer.join( '\n' ) ).to.equal( [
				'it( "something should happen", function() {',
				'\tvar a = 1;',
				'\tif( b == 2 ) {',
				'\t\ta = helperMethod();',
				'\t}',
				'} );'
			].join( "\n" ) );
		} );
	} );
	
	
	// -----------------------------------
	
	
	describe( 'removeSuperclassCall()', function() {
		var jasmineWriter = new JasmineWriter();
			
		it( "should remove a superclass call for a setUp method", function() {
			var input = [
				'app.controllers.quark.edit.AbstractSlideshowTest.prototype.setUp.apply( this, arguments );',
				'',
				'this.a = 1;',
				'this.b = 2;'
			].join( "\n" );
			
			var expected = [
				'this.a = 1;',
				'this.b = 2;'
			].join( "\n" );
			
			expect( jasmineWriter.removeSuperclassCall( input ) ).to.equal( expected );
		} );
		
			
		it( "should remove a superclass call for a setUp method, and any blank lines after it", function() {
			var input = [
				'app.controllers.quark.edit.AbstractSlideshowTest.prototype.setUp.apply( this, arguments );',
				'\t',  // some accidental indent
				'',
				'this.a = 1;',
				'this.b = 2;'
			].join( "\n" );
			
			var expected = [
				'this.a = 1;',
				'this.b = 2;'
			].join( "\n" );
			
			expect( jasmineWriter.removeSuperclassCall( input ) ).to.equal( expected );
		} );
		
		
		it( "should remove a superclass call for a tearDown method", function() {
			var input = [
				'this.a = 1;',
				'this.b = 2;',
				'app.controllers.quark.edit.AbstractSlideshowTest.prototype.tearDown.apply( this, arguments );'
			].join( "\n" );
			
			var expected = [
				'this.a = 1;',
				'this.b = 2;'
			].join( "\n" );
			
			expect( jasmineWriter.removeSuperclassCall( input ) ).to.equal( expected );
		} );
		
		
		it( "should remove a superclass call for a tearDown method, and any blank lines preceding it", function() {
			var input = [
				'this.a = 1;',
				'this.b = 2;',
				'\t',  // some accidental indent
				'',
				'app.controllers.quark.edit.AbstractSlideshowTest.prototype.tearDown.apply( this, arguments );'
			].join( "\n" );
			
			var expected = [
				'this.a = 1;',
				'this.b = 2;'
			].join( "\n" );
			
			expect( jasmineWriter.removeSuperclassCall( input ) ).to.equal( expected );
		} );
		
		
		it( "should not change a method that does not have a superclass call", function() {
			var input = [
				'this.a = 1;',
				'this.b = 2;'
			].join( "\n" );
			
			var expected = [
				'this.a = 1;',
				'this.b = 2;'
			].join( "\n" );
			
			expect( jasmineWriter.removeSuperclassCall( input ) ).to.equal( expected );
		} );
		
	} );
	
	
	describe( 'transformHelperMethodCalls()', function() {
		
		it( "should convert `this.methodName` to just `methodName` in the input", function() {
			var jasmineWriter = new JasmineWriter();
			
			var input = [
				'this.someHelper();',
				'this.someOtherHelper();',
				'this.somethingThatIsNotAHelperMethod();',
				'',
				'this.someHelper;',        // without function call operator
				'this.someOtherHelper;',   // without function call operator
				'',
				'this.someHelperWITHSUFFIX'   // this one shouldn't be converted
			].join( "\n" );
			
			var expectedOutput = [
				'someHelper();',
				'someOtherHelper();',
				'this.somethingThatIsNotAHelperMethod();',
				'',
				'someHelper;',        // without function call operator
				'someOtherHelper;',   // without function call operator
				'',
				'this.someHelperWITHSUFFIX'   // this one shouldn't be converted
			].join( "\n" );
			
			var helperMethods = [
				new HelperMethodNode( "someHelper", "", "" ),      // no args list or body
				new HelperMethodNode( "someOtherHelper", "", "" )  // no args list or body
			];
			
			var result = jasmineWriter.transformHelperMethodCalls( input, helperMethods );
			expect( result ).to.equal( expectedOutput );
		} );
		
	} );
	
	
	describe( 'transformThisReferences()', function() {
		
		it( "should change all `this` references to `thisSuite`, except the following: `this._super()`", function() {
			var jasmineWriter = new JasmineWriter();
			
			var input = [
				'this.a.destroy();',
				'this.b.destroy();',
				'this.$myEl.doSomething();',
				'this._someVar;',
				'this._super',    // this one shouldn't be changed
				'this.addEvents'  // this one shouldn't be changed
			].join( "\n" );
			
			var output = jasmineWriter.transformThisReferences( input );
			expect( output ).to.equal( [
				'thisSuite.a.destroy();',
				'thisSuite.b.destroy();',
				'thisSuite.$myEl.doSomething();',
				'thisSuite._someVar;',
				'this._super',
				'this.addEvents'
			].join( "\n" ) );
		} );
		
	} );
	
	
	describe( "removeTryCatchAroundJsMockito()", function() {
		var jasmineWriter;
		
		beforeEach( function() {
			jasmineWriter = new JasmineWriter();
		} );
		
		it( "should remove a try/catch block for JsMockito", function() {
			var input = [
				'try {',
				'\tJsMockito.verify( models[ 0 ] ).save();',
				'\tJsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();',
				'} catch( e ) {',
				'\tY.Assert.fail( typeof e === "string" ? e : e.message );',
				'}'
			].join( "\n" );
			
			var expected = [
				'JsMockito.verify( models[ 0 ] ).save();',
				'JsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();'
			].join( "\n" );
			
			expect( jasmineWriter.removeTryCatchAroundJsMockito( input ) ).to.equal( expected );
		} );
		
		
		it( "should remove multiple try/catch blocks for JsMockito", function() {
			var input = [
				'try {',
				'\tJsMockito.verify( models[ 0 ] ).save();',
				'\tJsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();',
				'} catch( e ) {',
				'\tY.Assert.fail( typeof e === "string" ? e : e.message );',
				'}',
				'// some other code here',
				'try {',
				'\tJsMockito.verify( models[ 0 ] ).save();',
				'\tJsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();',
				'} catch( e ) {',
				'\tY.Assert.fail( typeof e === "string" ? e : e.message );',
				'}'
			].join( "\n" );
			
			var expected = [
				'JsMockito.verify( models[ 0 ] ).save();',
				'JsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();',
				'// some other code here',
				'JsMockito.verify( models[ 0 ] ).save();',
				'JsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();'
			].join( "\n" );
			
			expect( jasmineWriter.removeTryCatchAroundJsMockito( input ) ).to.equal( expected );
		} );
		
		
		it( "should remove multiple try/catch blocks for JsMockito, and properly format whitespace when indented", function() {
			var input = [
				'\ttry {',
				'\t\tJsMockito.verify( models[ 0 ] ).save();',
				'\t\tJsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'\t\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'\t\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();',
				'\t} catch( e ) {',
				'\t\tY.Assert.fail( typeof e === "string" ? e : e.message );',
				'\t}',
				'\t// some other code here',
				'\ttry {',
				'\t\tJsMockito.verify( models[ 0 ] ).save();',
				'\t\tJsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'\t\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'\t\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();',
				'\t} catch( e ) {',
				'\t\tY.Assert.fail( typeof e === "string" ? e : e.message );',
				'\t}'
			].join( "\n" );
			
			var expected = [
				'\tJsMockito.verify( models[ 0 ] ).save();',
				'\tJsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();',
				'\t// some other code here',
				'\tJsMockito.verify( models[ 0 ] ).save();',
				'\tJsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();'
			].join( "\n" );
			
			expect( jasmineWriter.removeTryCatchAroundJsMockito( input ) ).to.equal( expected );
		} );
		
		
		it( "should leave non-JsMockito try/catch blocks alone", function() {
			var input = [
				'try {',
				'\tJsMockito.verify( models[ 0 ] ).save();',
				'\tJsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'\tJsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();',
				'} catch( e ) {',
				'\tY.Assert.fail( typeof e === "string" ? e : e.message );',
				'}',
				'// some other code here',
				'try {',
				'\t// Some other test here',
				'} catch( e ) {',
				'\tY.Assert.fail( typeof e === "string" ? e : e.message );',
				'}'
			].join( "\n" );
			
			var expected = [
				'JsMockito.verify( models[ 0 ] ).save();',
				'JsMockito.verify( models[ 0 ], JsMockito.Verifiers.never() ).destroy();',
				'JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).save();',
				'JsMockito.verify( models[ 1 ], JsMockito.Verifiers.never() ).destroy();',
				'// some other code here',
				'try {',
				'\t// Some other test here',
				'} catch( e ) {',
				'\tY.Assert.fail( typeof e === "string" ? e : e.message );',
				'}'
			].join( "\n" );
			
			expect( jasmineWriter.removeTryCatchAroundJsMockito( input ) ).to.equal( expected );
		} );
		
	} );
	
	
	
	describe( "convertAssertions()", function() {
		var jasmineWriter;
		
		beforeEach( function() {
			jasmineWriter = new JasmineWriter();
		} );
		
		
		describe( "Y.Assert package assertions", function() {
			
			it( "should properly convert Y.ArrayAssert.isUndefined() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isUndefined( myObj );' ) )
					.to.equal( 'expect( myObj ).toBeUndefined();' );
				
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isUndefined( myObj, "myObj should be undefined" );' ) )
					.to.equal( 'expect( myObj ).toBeUndefined();  // orig YUI Test err msg: "myObj should be undefined"' );
			} );
			
			it( "should properly convert Y.ArrayAssert.isNotUndefined() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isNotUndefined( myObj );' ) )
					.to.equal( 'expect( myObj ).not.toBeUndefined();' );
				
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isNotUndefined( myObj, "myObj should not be undefined" );' ) )
					.to.equal( 'expect( myObj ).not.toBeUndefined();  // orig YUI Test err msg: "myObj should not be undefined"' );
			} );
			
			
			it( "should properly convert Y.Assert.isNull() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isNull( someVar );' ) )
					.to.equal( 'expect( someVar ).toBe( null );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isNull( someVar, "someVar should have been null" );' ) )
					.to.equal( 'expect( someVar ).toBe( null );  // orig YUI Test err msg: "someVar should have been null"' );
			} );
			
			
			it( "should properly convert Y.Assert.isNotNull() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isNotNull( someVar );' ) )
					.to.equal( 'expect( someVar ).not.toBe( null );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isNotNull( someVar, "someVar should have not been null" );' ) )
					.to.equal( 'expect( someVar ).not.toBe( null );  // orig YUI Test err msg: "someVar should have not been null"' );
			} );
			
			
			it( "should properly convert Y.Assert.isTrue() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isTrue( something );' ) )
					.to.equal( 'expect( something ).toBe( true );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isTrue( something, "something should have been true" );' ) )
					.to.equal( 'expect( something ).toBe( true );  // orig YUI Test err msg: "something should have been true"' );
			} );
			
			
			it( "should properly convert Y.Assert.isFalse() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isFalse( something );' ) )
					.to.equal( 'expect( something ).toBe( false );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isFalse( something, "something should have been false" );' ) )
					.to.equal( 'expect( something ).toBe( false );  // orig YUI Test err msg: "something should have been false"' );
			} );
			
			
			it( "should properly convert Y.ArrayAssert.isString() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isString( myString );' ) )
					.to.equal( 'expect( _.isString( myString ) ).toBe( true );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isString( myString, "myString should be a string" );' ) )
					.to.equal( 'expect( _.isString( myString ) ).toBe( true );  // orig YUI Test err msg: "myString should be a string"' );
			} );
			
			
			it( "should properly convert Y.ArrayAssert.isNumber() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isNumber( myNum );' ) )
					.to.equal( 'expect( _.isNumber( myNum ) ).toBe( true );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isNumber( myNum, "myNum should be a number" );' ) )
					.to.equal( 'expect( _.isNumber( myNum ) ).toBe( true );  // orig YUI Test err msg: "myNum should be a number"' );
			} );
			
			
			it( "should properly convert Y.Assert.isObject() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isObject( someVar );' ) )
					.to.equal( 'expect( _.isObject( someVar ) ).toBe( true );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isObject( someVar, "someVar should have been an object" );' ) )
					.to.equal( 'expect( _.isObject( someVar ) ).toBe( true );  // orig YUI Test err msg: "someVar should have been an object"' );
			} );
			
			
			it( "should properly convert Y.Assert.isArray() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isArray( someVar );' ) )
					.to.equal( 'expect( _.isArray( someVar ) ).toBe( true );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isArray( someVar, "someVar should have been an array" );' ) )
					.to.equal( 'expect( _.isArray( someVar ) ).toBe( true );  // orig YUI Test err msg: "someVar should have been an array"' );
			} );
			
			
			it( "should properly convert Y.Assert.isFunction() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isFunction( someVar );' ) )
					.to.equal( 'expect( _.isFunction( someVar ) ).toBe( true );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isFunction( someVar, "someVar should have been a function" );' ) )
					.to.equal( 'expect( _.isFunction( someVar ) ).toBe( true );  // orig YUI Test err msg: "someVar should have been a function"' );
			} );
			
			
			it( "should properly convert Y.Assert.isInstanceOf() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isInstanceOf( SomeClass, someVar );' ) )
					.to.equal( 'expect( someVar instanceof SomeClass ).toBe( true );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isInstanceOf( SomeClass, someVar, "someVar should have been an instance of SomeClass" );' ) )
					.to.equal( 'expect( someVar instanceof SomeClass ).toBe( true );  // orig YUI Test err msg: "someVar should have been an instance of SomeClass"' );
			} );
			
			
			it( "should properly convert Y.Assert.isNaN() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isNaN( value );' ) )
					.to.equal( 'expect( isNaN( value ) ).toBe( true );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isNaN( value, "value should have been NaN" );' ) )
					.to.equal( 'expect( isNaN( value ) ).toBe( true );  // orig YUI Test err msg: "value should have been NaN"' );
			} );
			
			
			it( "should properly convert Y.Assert.isNotNaN() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isNotNaN( value );' ) )
					.to.equal( 'expect( isNaN( value ) ).toBe( false );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.Assert.isNotNaN( value, "value should have not been NaN" );' ) )
					.to.equal( 'expect( isNaN( value ) ).toBe( false );  // orig YUI Test err msg: "value should have not been NaN"' );
			} );
			
			
			it( "should properly convert Y.Assert.areSame() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.Assert.areSame( something, somethingElse );' ) )
					.to.equal( 'expect( somethingElse ).toBe( something );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.Assert.areSame( something, somethingElse, "something should have been somethingElse" );' ) )
					.to.equal( 'expect( somethingElse ).toBe( something );  // orig YUI Test err msg: "something should have been somethingElse"' );
			} );
			
			
			it( "should properly convert Y.Assert.areNotSame() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.Assert.areNotSame( something, somethingElse );' ) )
					.to.equal( 'expect( somethingElse ).not.toBe( something );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.Assert.areNotSame( something, somethingElse, "something should have been somethingElse" );' ) )
					.to.equal( 'expect( somethingElse ).not.toBe( something );  // orig YUI Test err msg: "something should have been somethingElse"' );
			} );
			
			
			it( "should properly convert Y.Assert.areEqual() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.Assert.areEqual( something, somethingElse );' ) )
					.to.equal( 'expect( somethingElse ).toEqual( something );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.Assert.areEqual( something, somethingElse, "something should have been equal to somethingElse" );' ) )
					.to.equal( 'expect( somethingElse ).toEqual( something );  // orig YUI Test err msg: "something should have been equal to somethingElse"' );
			} );
			
			
			it( "should properly convert Y.Assert.areNotEqual() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.Assert.areNotEqual( something, somethingElse );' ) )
					.to.equal( 'expect( somethingElse ).not.toEqual( something );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.Assert.areNotEqual( something, somethingElse, "something should have been equal to somethingElse" );' ) )
					.to.equal( 'expect( somethingElse ).not.toEqual( something );  // orig YUI Test err msg: "something should have been equal to somethingElse"' );
			} );
			
			
			it( "should properly convert Y.Assert.fail() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.Assert.fail( "test should have errored by now" );' ) )
					.to.equal( 'expect( true ).toBe( false );  // orig YUI Test err msg: "test should have errored by now"' );
			} );
		
		} );
		
		
		describe( "Y.ArrayAssert package assertions", function() {
			
			it( "should properly convert Y.ArrayAssert.contains() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.ArrayAssert.contains( "myElem", elems );' ) )
					.to.equal( 'expect( elems ).toContain( "myElem" );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.ArrayAssert.contains( "myElem", elems, "elems should contain myElem" );' ) )
					.to.equal( 'expect( elems ).toContain( "myElem" );  // orig YUI Test err msg: "elems should contain myElem"' );
			} );
			
			it( "should properly convert Y.ArrayAssert.doesNotContain() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.ArrayAssert.doesNotContain( "myElem", elems );' ) )
					.to.equal( 'expect( elems ).not.toContain( "myElem" );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.ArrayAssert.doesNotContain( "myElem", elems, "elems should not contain myElem" );' ) )
					.to.equal( 'expect( elems ).not.toContain( "myElem" );  // orig YUI Test err msg: "elems should not contain myElem"' );
			} );
			
			
			it( "should properly convert Y.ArrayAssert.containsItems() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.ArrayAssert.containsItems( [ "a", "b" ], elems );' ) )
					.to.equal( 'expect( _.intersection( [ "a", "b" ], elems ).length ).toBe( [ "a", "b" ].length );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.ArrayAssert.containsItems( myEls, elems );' ) )
					.to.equal( 'expect( _.intersection( myEls, elems ).length ).toBe( myEls.length );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.ArrayAssert.containsItems( [ "a", "b" ], elems, "elems should contain a and b" );' ) )
					.to.equal( 'expect( _.intersection( [ "a", "b" ], elems ).length ).toBe( [ "a", "b" ].length );  // orig YUI Test err msg: "elems should contain a and b"' );
			} );
			
			
			it( "should properly convert Y.ArrayAssert.itemsAreSame() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.ArrayAssert.itemsAreSame( [ "attr1", "attr2" ], attrs );' ) )
					.to.equal( 'expect( attrs ).toEqual( [ "attr1", "attr2" ] );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.ArrayAssert.itemsAreSame( [ "attr1", "attr2" ], attrs, "attrs should be attr1 and attr2" );' ) )
					.to.equal( 'expect( attrs ).toEqual( [ "attr1", "attr2" ] );  // orig YUI Test err msg: "attrs should be attr1 and attr2"' );
			} );
			
			
			it( "should properly convert Y.ArrayAssert.isEmpty() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.ArrayAssert.isEmpty( attrs );' ) )
					.to.equal( 'expect( attrs ).toEqual( [] );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.ArrayAssert.isEmpty( attrs, "attrs should be empty" );' ) )
					.to.equal( 'expect( attrs ).toEqual( [] );  // orig YUI Test err msg: "attrs should be empty"' );
			} );
			
		} );
		
		
		describe( "Y.ObjectAssert package assertions", function() {
			
			it( "should properly convert Y.ObjectAssert.hasKey() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.ObjectAssert.hasKey( "attr1", data );' ) )
					.to.equal( 'expect( data.hasOwnProperty( "attr1" ) ).toBe( true );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.ObjectAssert.hasKey( "attr1", data, "data should have attr1" );' ) )
					.to.equal( 'expect( data.hasOwnProperty( "attr1" ) ).toBe( true );  // orig YUI Test err msg: "data should have attr1"' );
			} );
			
			it( "should properly convert Y.ObjectAssert.ownsKeys() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.ObjectAssert.ownsKeys( [ "attr1", "attr2" ], data );' ) )
					.to.equal( 'expect( data.hasOwnProperty( "attr1" ) ).toBe( true );expect( data.hasOwnProperty( "attr2" ) ).toBe( true );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.ObjectAssert.ownsKeys( [ "attr1", "attr2" ], data, "data should have attr1 and attr2" );' ) )
					.to.equal( 'expect( data.hasOwnProperty( "attr1" ) ).toBe( true );expect( data.hasOwnProperty( "attr2" ) ).toBe( true );  // orig YUI Test err msg: "data should have attr1 and attr2"' );
			} );
			
			it( "should properly convert Y.ObjectAssert.hasKeys() assertions", function() {
				expect( jasmineWriter.convertAssertions( 'Y.ObjectAssert.hasKeys( [ "attr1", "attr2" ], data );' ) )
					.to.equal( 'expect( data.hasOwnProperty( "attr1" ) ).toBe( true );expect( data.hasOwnProperty( "attr2" ) ).toBe( true );' );
				
				expect( jasmineWriter.convertAssertions( 'Y.ObjectAssert.hasKeys( [ "attr1", "attr2" ], data, "data should have attr1 and attr2" );' ) )
					.to.equal( 'expect( data.hasOwnProperty( "attr1" ) ).toBe( true );expect( data.hasOwnProperty( "attr2" ) ).toBe( true );  // orig YUI Test err msg: "data should have attr1 and attr2"' );
			} );
			
		} );
		
	} );
	
} );