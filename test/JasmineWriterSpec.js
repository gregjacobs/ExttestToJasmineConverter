/*global require, describe, it */
var expect = require( 'chai' ).expect,
    JasmineWriter = require( '../src/JasmineWriter' ),
    SuiteNode = require( '../src/node/Suite' ),
    TestCaseNode = require( '../src/node/TestCase' ),
    ShouldNode = require( '../src/node/Should' ),
    SetUpNode = require( '../src/node/SetUp' ),
    TearDownNode = require( '../src/node/TearDown' ),
    TestNode = require( '../src/node/Test' );

describe( 'node.JasmineWriter', function() {
	
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
				null,  // setUp
				null,  // tearDown
				null,  // should
				[]     // tests
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
				null,  // setUp
				null,  // tearDown
				null,  // should
				[]     // tests
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
			
			
			var testCaseNode = new TestCaseNode(
				"My Test Case",
				setUpNode,
				tearDownNode,
				shouldNode,
				[ testNode1, testNode2, testNode3 ]
			);
			jasmineWriter.appendTestCase( testCaseNode, buffer );
			
			expect( buffer.join( '\n' ) ).to.equal( [
				'describe( "My Test Case", function() {',
				'\tvar thisSuite = {};',
				'\t',
				'\tbeforeEach( function() {',
				'\t\tthis.a = 1;',
				'\t\tthis.b = 2;',
				'\t} );',
				'\t',
				'\tafterEach( function() {',
				'\t\tthis.a.destroy();',
				'\t\tthis.b.destroy();',
				'\t} );',
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
		
		it( "should create the code to transform an Ext.Test setUp() method", function() {
			var jasmineWriter = new JasmineWriter( {
				indentStr : '\t'
			} );
			var buffer = [];
			
			var setUpNode = new SetUpNode( [
				'this.a = 1;',
				'this.b = 2;'
			].join( "\n" ) );
			
			jasmineWriter.appendSetUp( setUpNode, buffer );
			expect( buffer.join( '\n' ) ).to.equal( [
				'var thisSuite = {};',
				'',
				'beforeEach( function() {',
				'\tthis.a = 1;',
				'\tthis.b = 2;',
				'} );'
			].join( "\n" ) );
		} );
		
	} );
	
	
	describe( 'appendTearDown()', function() {
		
		it( "should create the code to transform an Ext.Test tearDown() method", function() {
			var jasmineWriter = new JasmineWriter( {
				indentStr : '\t'
			} );
			var buffer = [];
			
			var tearDownNode = new TearDownNode( [
				'this.a.destroy();',
				'this.b.destroy();'
			].join( "\n" ) );
			
			jasmineWriter.appendTearDown( tearDownNode, buffer );
			expect( buffer.join( '\n' ) ).to.equal( [
				'afterEach( function() {',
				'\tthis.a.destroy();',
				'\tthis.b.destroy();',
				'} );'
			].join( "\n" ) );
		} );
		
	} );
	
	
	describe( 'appendTest()', function() {
		
		it( "should create the code to transform an Ext.Test tearDown() method, with no `should` instructions", function() {
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
			
			jasmineWriter.appendTest( testNode, null, buffer );
			
			expect( buffer.join( '\n' ) ).to.equal( [
				'it( "something should happen", function() {',
				'\tvar a = 1;',
				'\tif( b == 2 ) {',
				'\t\ta = 2;',
				'\t}',
				'} );'
			].join( "\n" ) );
		} );
		
		
		it( "should create the code to transform an Ext.Test tearDown() method, with an ignore `should` instruction ('it' function should become 'xit')", function() {
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
			
			jasmineWriter.appendTest( testNode, shouldNode, buffer );
			
			expect( buffer.join( '\n' ) ).to.equal( [
				'xit( "something should happen", function() {',
				'\tvar a = 1;',
				'\tif( b == 2 ) {',
				'\t\ta = 2;',
				'\t}',
				'} );'
			].join( "\n" ) );
		} );
		
		
		it( "should create the code to transform an Ext.Test tearDown() method, with a 'should fail' `should` instruction (code body should be wrapped in an expectation to throw an error)", function() {
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
			
			jasmineWriter.appendTest( testNode, shouldNode, buffer );
			
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
		
		
		it( "should create the code to transform an Ext.Test tearDown() method, with both 'ignore' and 'should fail' `should` instructions", function() {
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
			
			jasmineWriter.appendTest( testNode, shouldNode, buffer );
			
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
		
	} );
	
} );