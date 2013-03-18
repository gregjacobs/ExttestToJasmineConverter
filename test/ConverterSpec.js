/*global require, __dirname, describe, xdescribe, beforeEach, afterEach, it, xit */
var expect    = require( 'chai' ).expect,
    fs        = require( 'fs' ),
    Converter = require( '../src/Converter' );

describe( "Converter", function() {
	var converter;
	
	beforeEach( function() {
		converter = new Converter();
	} );
	
	describe( "convertJsHintGlobals()", function() {
		
		it( "should add the Jasmine globals to the input string when none are present", function() {
			var input = "test test test",
			    output = converter.convertJsHintGlobals( input );
			
			expect( output ).to.equal( "/*global describe, beforeEach, afterEach, it, expect */\n" + input );
		} );
		
		
		it( "should modify existing globals, removing 'Ext', 'Y', and 'tests' globals, and adding the Jasmine ones", function() {
			var input = "/*global window, jQuery, _, Ext, Y, tests */\ntest test test",
			    output = converter.convertJsHintGlobals( input );
			
			expect( output ).to.equal( "/*global window, jQuery, _, describe, beforeEach, afterEach, it, expect */\ntest test test" );
		} );
		
		
		it( "should modify existing globals, removing 'Ext', 'Y', and 'tests' globals, adding Jasmine ones, and moving JsMockito to the end of the list if present", function() {
			var input = "/*global window, jQuery, _, Ext, Y, JsMockito, tests */\ntest test test",
			    output = converter.convertJsHintGlobals( input );
			
			expect( output ).to.equal( "/*global window, jQuery, _, describe, beforeEach, afterEach, it, expect, JsMockito */\ntest test test" );
		} );
		
	} );
	
	
	describe( "removeItemsArrays()", function() {
		
		it( "should remove the `items` arrays, and decrease the level of indent for all of the code inside it", function() {
			var input = [
				'items : [\n',
				'\tOneIndent1\n',
				'\tOneIndent2\n',
				'\t\tTwoIndent\n',
				'\tOneIndent3\n',
				']'
			].join( "" );
			
			var output = converter.removeItemsArrays( input );
			expect( output ).to.equal( [
				'OneIndent1\n',
				'OneIndent2\n',
				'\tTwoIndent\n',
				'OneIndent3\n'
			].join( "" ) );
		} );
		
		
		it( "should remove all `items` arrays (including nested ones), and decrease the level of indent for all of the code inside them", function() {
			var input = [
				'items : [\n',
				'\tOneIndent1\n',
				'\tOneIndent2\n',
				'\t\tTwoIndent\n',
				'\t\titems : [\n',
				'\t\t\tThreeIndent1\n',
				'\t\t\tThreeIndent2\n',
				'\t\t]\n',
				'\tOneIndent3\n',
				']'
			].join( "" );
			
			var output = converter.removeItemsArrays( input );
			expect( output ).to.equal( [
				'OneIndent1\n',
				'OneIndent2\n',
				'\tTwoIndent\n',
				'\tThreeIndent1\n',  // an extra newline removed because inside nested items[]
				'\tThreeIndent2\n',  // an extra newline removed because inside nested items[]
				'OneIndent3\n'
			].join( "" ) );
		} );
		
		
		it( "should remove all `items` arrays (including nested ones), with a proper nested object structure", function() {
			var input = [
				'items : [\n',
				'\t{\n',
				'\t\t"Something should do something" : function() {\n',
				'\t\t\tvar a = 1;\n',
				'\t\t},\n',
				'\t\t{\n',
				'\t\t\titems : [\n',
				'\t\t\t\t"Something should do something else" : function() {\n',
				'\t\t\t\t\tvar b = 2;\n',
				'\t\t\t\t}\n',
				'\t\t\t]\n',
				'\t\t}\n',
				'\t}\n',
				']'
			].join( "" );
			
			var output = converter.removeItemsArrays( input );
			expect( output ).to.equal( [
				'{\n',
				'\t"Something should do something" : function() {\n',
				'\t\tvar a = 1;\n',
				'\t},\n',
				'\t{\n',
				'\t\t"Something should do something else" : function() {\n',
				'\t\t\tvar b = 2;\n',
				'\t\t}\n',
				'\t}\n',
				'}\n'
			].join( "" ) );
		} );
		
	} );
	
	
	describe( "removeTryCatchAroundJsMockito()", function() {
		
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
			
			expect( converter.removeTryCatchAroundJsMockito( input ) ).to.equal( expected );
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
			
			expect( converter.removeTryCatchAroundJsMockito( input ) ).to.equal( expected );
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
			
			expect( converter.removeTryCatchAroundJsMockito( input ) ).to.equal( expected );
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
			
			expect( converter.removeTryCatchAroundJsMockito( input ) ).to.equal( expected );
		} );
		
	} );
	
	
	
	describe( "convertOuterSuite()", function() {
		
		it( "should convert the outer suite block to a `describe()` block", function() {
			
			var input = [
				'tests.unit.thePackage.add( new Ext.test.TestSuite( {',
				'\tname: "TheClass",',
				'\t"something should happen" : function() {',
				'\t\tvar a = 1;',
				'\t}',
				'} ) );'
			].join( "\n" );
			
			var output = converter.convertOuterSuite( input );
			expect( output ).to.equal( [
				'describe( "unit.thePackage.TheClass", function() {',
				'\t"something should happen" : function() {',
				'\t\tvar a = 1;',
				'\t}',
				'} );'
			].join( "\n" ) );
		} );
		
		
		it( "should convert the outer suite block to a `describe()` block, even if it is indented", function() {
			var input = [
				'\ttests.unit.thePackage.add( new Ext.test.TestSuite( {',
				'\t\tname: "TheClass",',
				'\t\t"something should happen" : function() {',
				'\t\t\tvar a = 1;',
				'\t\t}',
				'\t} ) );'
			].join( "\n" );
			
			var output = converter.convertOuterSuite( input );
			expect( output ).to.equal( [
				'\tdescribe( "unit.thePackage.TheClass", function() {',
				'\t\t"something should happen" : function() {',
				'\t\t\tvar a = 1;',
				'\t\t}',
				'\t} );'
			].join( "\n" ) );
		} );
		
		
		it( "should convert the outer suite block to a `describe()` block, even if it is indented with 4 spaces", function() {
			var input = [
				'    tests.unit.thePackage.add( new Ext.test.TestSuite( {',
				'        name: "TheClass",',
				'        "something should happen" : function() {',
				'            var a = 1;',
				'        }',
				'    } ) );'
			].join( "\n" );
			
			var output = converter.convertOuterSuite( input );
			expect( output ).to.equal( [
				'    describe( "unit.thePackage.TheClass", function() {',
				'        "something should happen" : function() {',
				'            var a = 1;',
				'        }',
				'    } );'
			].join( "\n" ) );
		} );
		
	} );
	
	
	describe( "convertSuites()", function() {
		
		it( "should convert suites to describe() blocks", function() {
			var input = [
				'{',
				'\t/*',
				'\t * Test something()',
				'\t */',
				'\tname: "Test something()",',
				'\t"something should happen" : function() {',
				'\t\tvar a = 1;',
				'\t}',
				'}'
			].join( "\n" );
			
			var output = converter.convertSuites( input );
			expect( output ).to.equal( [
				'describe( "Test something()", function() {',
				'\t"something should happen" : function() {',
				'\t\tvar a = 1;',
				'\t}',
				'} );'
			].join( "\n" ) );
		} );
		
		
		it( "should convert multiple suites to describe() blocks", function() {
			var input = [
				'{',
				'\t/*',
				'\t * Test something()',
				'\t */',
				'\tname: "Test something()",',
				'\t"something should happen" : function() {',
				'\t\tvar a = 1;',
				'\t}',
				'},',
				'',
				'{',
				'\t/*',
				'\t * Test something()',
				'\t */',
				'\tname: "Test something2()",',
				'\t"something2 should happen" : function() {',
				'\t\tvar a = 1;',
				'\t}',
				'}'
			].join( "\n" );
			
			var output = converter.convertSuites( input );
			expect( output ).to.equal( [
				'describe( "Test something()", function() {',
				'\t"something should happen" : function() {',
				'\t\tvar a = 1;',
				'\t}',
				'} );',
				'',
				'describe( "Test something2()", function() {',
				'\t"something2 should happen" : function() {',
				'\t\tvar a = 1;',
				'\t}',
				'} );'
			].join( "\n" ) );
		} );
		
		it( "should convert suites to describe() blocks and remove any 'ttype' attribute", function() {
			var input = [
				'{',
				'\t/*',
				'\t * Test something()',
				'\t */',
				'\tname  : "Test something()",',
				'\tttype : "suite",',
				'\t"something should happen" : function() {',
				'\t\tvar a = 1;',
				'\t}',
				'}'
			].join( "\n" );
			
			var output = converter.convertSuites( input );
			expect( output ).to.equal( [
				'describe( "Test something()", function() {',
				'\t"something should happen" : function() {',
				'\t\tvar a = 1;',
				'\t}',
				'} );'
			].join( "\n" ) );
		} );
		
	} );
	
	
	
	describe( "convertSetUpAndTearDown()", function() {
		
		it( "should convert setUp() to Jasmine's `beforeEach()`, adding the `thisSuite` var declaration above it, and changing all `this` refs to `thisSuite`", function() {
			var input = [
				'setUp : function() {',
				'\tthis.proxy = new RestProxy( {',
				'\t\turlRoot : "/testUrl"',
				'\t\tappendId : false',
				'\t} );',
				'},'
			].join( '\n' );
			
			var expectedOutput = [
				'var thisSuite = {};',
				'',
				'beforeEach( function() {',
				'\tthisSuite.proxy = new RestProxy( {',
				'\t\turlRoot : "/testUrl"',
				'\t\tappendId : false',
				'\t} );',
				'} );'
			].join( '\n' );
			
			expect( converter.convertSetUpAndTearDown( input ) ).to.equal( expectedOutput );
		} );
		
		
		it( "should convert setUp() to Jasmine's `beforeEach()`, keeping the same indent level", function() {
			var input = [
				'\t\tsetUp : function() {',
				'\t\t\tthis.proxy = new RestProxy( {',
				'\t\t\t\turlRoot : "/testUrl"',
				'\t\t\t\tappendId : false',
				'\t\t\t} );',
				'\t\t},'
			].join( '\n' );
			
			var expectedOutput = [
				'\t\tvar thisSuite = {};',
				'',
				'\t\tbeforeEach( function() {',
				'\t\t\tthisSuite.proxy = new RestProxy( {',
				'\t\t\t\turlRoot : "/testUrl"',
				'\t\t\t\tappendId : false',
				'\t\t\t} );',
				'\t\t} );'
			].join( '\n' );
			
			expect( converter.convertSetUpAndTearDown( input ) ).to.equal( expectedOutput );
		} );
		
		
		it( "should convert tearDown() to Jasmine's `afterEach()`, converting any `this` refs to `thisSuite`", function() {
			var input = [
				'tearDown : function() {',
				'\tthis.proxy.destroy();',
				'},'
			].join( '\n' );
			
			var expectedOutput = [
				'afterEach( function() {',
				'\tthisSuite.proxy.destroy();',
				'} );'
			].join( '\n' );
			
			expect( converter.convertSetUpAndTearDown( input ) ).to.equal( expectedOutput );
		} );
		
		
		it( "should convert tearDown() to Jasmine's `afterEach()`, keeping the same indent level", function() {
			var input = [
				'\t\ttearDown : function() {',
				'\t\t\tthis.proxy.destroy();',
				'\t\t},'
			].join( '\n' );
			
			var expectedOutput = [
				'\t\tafterEach( function() {',
				'\t\t\tthisSuite.proxy.destroy();',
				'\t\t} );'
			].join( '\n' );
			
			expect( converter.convertSetUpAndTearDown( input ) ).to.equal( expectedOutput );
		} );
		
	} );
	
	
	describe( "convertTests()", function() {
		
		it( "should convert tests to it() blocks", function() {
			var input = [
				'describe( "Test something()", function() {',
				'\t"something should happen" : function() {',
				'\t\tvar a = 1;',
				'\t}',
				'} );'
			].join( "\n" );
			
			var output = converter.convertTests( input );
			expect( output ).to.equal( [
				'describe( "Test something()", function() {',
				'\tit( "something should happen", function() {',
				'\t\tvar a = 1;',
				'\t} );',
				'} );'
			].join( "\n" ) );
			
		} );
		
		
		it( "should convert multiple tests to it() blocks", function() {
			var input = [
				'describe( "Test something()", function() {',
				'\t"something should happen" : function() {',
				'\t\tvar a = 1;',
				'\t}',
				'} );',
				'',
				'describe( "Test something2()", function() {',
				'\t"something2 should happen" : function() {',
				'\t\tvar a = 1;',
				'\t}',
				'} );'
			].join( "\n" );
			
			var output = converter.convertTests( input );
			expect( output ).to.equal( [
				'describe( "Test something()", function() {',
				'\tit( "something should happen", function() {',
				'\t\tvar a = 1;',
				'\t} );',
				'} );',
				'',
				'describe( "Test something2()", function() {',
				'\tit( "something2 should happen", function() {',
				'\t\tvar a = 1;',
				'\t} );',
				'} );'
			].join( "\n" ) );
		} );
		
		
		it( "should convert a mixture of new and old-style tests (old style = tests named starting with 'test') to it() blocks", function() {
			var input = [
				'describe( "Test something()", function() {',
				'\ttest_somethingShouldHappen : function() {',
				'\t\tvar a = 1;',
				'\t},',
				'',
				'\ttestSomethingElseShouldHappen : function() {',
				'\t\tvar a = 1;',
				'\t}',
				'} );',
				'',
				'',
				'describe( "Test something2()", function() {',
				'\t"something2 should happen" : function() {',
				'\t\tvar a = 1;',
				'\t}',
				'} );'
			].join( "\n" );
			
			var output = converter.convertTests( input );
			expect( output ).to.equal( [
				'describe( "Test something()", function() {',
				'\tit( "somethingShouldHappen", function() {',
				'\t\tvar a = 1;',
				'\t} );',
				'',
				'\tit( "SomethingElseShouldHappen", function() {',
				'\t\tvar a = 1;',
				'\t} );',
				'} );',
				'',
				'',
				'describe( "Test something2()", function() {',
				'\tit( "something2 should happen", function() {',
				'\t\tvar a = 1;',
				'\t} );',
				'} );'
			].join( "\n" ) );
		} );
		
		
		it( "should convert `this` references in tests to `thisSuite`", function() {
			var input = [
				'describe( "Test something()", function() {',
				'\t"something should happen" : function() {',
				'\t\tvar a = this.something;',
				'\t}',
				'} );'
			].join( "\n" );
			
			var output = converter.convertTests( input );
			expect( output ).to.equal( [
				'describe( "Test something()", function() {',
				'\tit( "something should happen", function() {',
				'\t\tvar a = thisSuite.something;',
				'\t} );',
				'} );'
			].join( "\n" ) );
			
		} );
		
	} );
	
	
	describe( "convertAssertions()", function() {
		
		describe( "Y.Assert package assertions", function() {			
			
			it( "should properly convert Y.ArrayAssert.isUndefined() assertions", function() {
				expect( converter.convertAssertions( 'Y.Assert.isUndefined( myObj );' ) )
					.to.equal( 'expect( _.isUndefined( myObj ) ).toBe( true );' );
				
				expect( converter.convertAssertions( 'Y.Assert.isUndefined( myObj, "myObj should be undefined" );' ) )
					.to.equal( 'expect( _.isUndefined( myObj ) ).toBe( true );  // orig YUI Test err msg: "myObj should be undefined"' );
			} );
			
			
			it( "should properly convert Y.Assert.isNull() assertions", function() {
				expect( converter.convertAssertions( 'Y.Assert.isNull( someVar );' ) )
					.to.equal( 'expect( someVar ).toBe( null );' );
				
				expect( converter.convertAssertions( 'Y.Assert.isNull( someVar, "someVar should have been null" );' ) )
					.to.equal( 'expect( someVar ).toBe( null );  // orig YUI Test err msg: "someVar should have been null"' );
			} );
			
			
			it( "should properly convert Y.Assert.isNotNull() assertions", function() {
				expect( converter.convertAssertions( 'Y.Assert.isNotNull( someVar );' ) )
					.to.equal( 'expect( someVar ).not.toBe( null );' );
				
				expect( converter.convertAssertions( 'Y.Assert.isNotNull( someVar, "someVar should have not been null" );' ) )
					.to.equal( 'expect( someVar ).not.toBe( null );  // orig YUI Test err msg: "someVar should have not been null"' );
			} );
			
			
			it( "should properly convert Y.Assert.isTrue() assertions", function() {
				expect( converter.convertAssertions( 'Y.Assert.isTrue( something );' ) )
					.to.equal( 'expect( something ).toBe( true );' );
				
				expect( converter.convertAssertions( 'Y.Assert.isTrue( something, "something should have been true" );' ) )
					.to.equal( 'expect( something ).toBe( true );  // orig YUI Test err msg: "something should have been true"' );
			} );
			
			
			it( "should properly convert Y.Assert.isFalse() assertions", function() {
				expect( converter.convertAssertions( 'Y.Assert.isFalse( something );' ) )
					.to.equal( 'expect( something ).toBe( false );' );
				
				expect( converter.convertAssertions( 'Y.Assert.isFalse( something, "something should have been false" );' ) )
					.to.equal( 'expect( something ).toBe( false );  // orig YUI Test err msg: "something should have been false"' );
			} );
			
			
			it( "should properly convert Y.ArrayAssert.isString() assertions", function() {
				expect( converter.convertAssertions( 'Y.Assert.isString( myString );' ) )
					.to.equal( 'expect( _.isString( myString ) ).toBe( true );' );
				
				expect( converter.convertAssertions( 'Y.Assert.isString( myString, "myString should be a string" );' ) )
					.to.equal( 'expect( _.isString( myString ) ).toBe( true );  // orig YUI Test err msg: "myString should be a string"' );
			} );
			
			
			it( "should properly convert Y.Assert.isObject() assertions", function() {
				expect( converter.convertAssertions( 'Y.Assert.isObject( someVar );' ) )
					.to.equal( 'expect( _.isObject( someVar ) ).toBe( true );' );
				
				expect( converter.convertAssertions( 'Y.Assert.isObject( someVar, "someVar should have been an object" );' ) )
					.to.equal( 'expect( _.isObject( someVar ) ).toBe( true );  // orig YUI Test err msg: "someVar should have been an object"' );
			} );
			
			
			it( "should properly convert Y.Assert.isArray() assertions", function() {
				expect( converter.convertAssertions( 'Y.Assert.isArray( someVar );' ) )
					.to.equal( 'expect( _.isArray( someVar ) ).toBe( true );' );
				
				expect( converter.convertAssertions( 'Y.Assert.isArray( someVar, "someVar should have been an array" );' ) )
					.to.equal( 'expect( _.isArray( someVar ) ).toBe( true );  // orig YUI Test err msg: "someVar should have been an array"' );
			} );
			
			
			it( "should properly convert Y.Assert.isInstanceOf() assertions", function() {
				expect( converter.convertAssertions( 'Y.Assert.isInstanceOf( SomeClass, someVar );' ) )
					.to.equal( 'expect( someVar instanceof SomeClass ).toBe( true );' );
				
				expect( converter.convertAssertions( 'Y.Assert.isInstanceOf( SomeClass, someVar, "someVar should have been an instance of SomeClass" );' ) )
					.to.equal( 'expect( someVar instanceof SomeClass ).toBe( true );  // orig YUI Test err msg: "someVar should have been an instance of SomeClass"' );
			} );
			
			
			it( "should properly convert Y.Assert.areSame() assertions", function() {
				expect( converter.convertAssertions( 'Y.Assert.areSame( something, somethingElse );' ) )
					.to.equal( 'expect( somethingElse ).toBe( something );' );
				
				expect( converter.convertAssertions( 'Y.Assert.areSame( something, somethingElse, "something should have been somethingElse" );' ) )
					.to.equal( 'expect( somethingElse ).toBe( something );  // orig YUI Test err msg: "something should have been somethingElse"' );
			} );
			
			
			it( "should properly convert Y.Assert.areEqual() assertions", function() {
				expect( converter.convertAssertions( 'Y.Assert.areEqual( something, somethingElse );' ) )
					.to.equal( 'expect( somethingElse ).toEqual( something );' );
				
				expect( converter.convertAssertions( 'Y.Assert.areEqual( something, somethingElse, "something should have been equal to somethingElse" );' ) )
					.to.equal( 'expect( somethingElse ).toEqual( something );  // orig YUI Test err msg: "something should have been equal to somethingElse"' );
			} );
			
			
			it( "should properly convert Y.Assert.fail() assertions", function() {
				expect( converter.convertAssertions( 'Y.Assert.fail( "test should have errored by now" );' ) )
					.to.equal( 'expect( true ).toBe( false );  // orig YUI Test err msg: "test should have errored by now"' );
			} );
		
		} );
		
		
		describe( "Y.ArrayAssert package assertions", function() {
			
			it( "should properly convert Y.ArrayAssert.contains() assertions", function() {
				expect( converter.convertAssertions( 'Y.ArrayAssert.contains( "myElem", elems );' ) )
					.to.equal( 'expect( elems ).toContain( "myElem" );' );
				
				expect( converter.convertAssertions( 'Y.ArrayAssert.contains( "myElem", elems, "elems should contain myElem" );' ) )
					.to.equal( 'expect( elems ).toContain( "myElem" );  // orig YUI Test err msg: "elems should contain myElem"' );
			} );
			
			it( "should properly convert Y.ArrayAssert.doesNotContain() assertions", function() {
				expect( converter.convertAssertions( 'Y.ArrayAssert.doesNotContain( "myElem", elems );' ) )
					.to.equal( 'expect( elems ).not.toContain( "myElem" );' );
				
				expect( converter.convertAssertions( 'Y.ArrayAssert.doesNotContain( "myElem", elems, "elems should not contain myElem" );' ) )
					.to.equal( 'expect( elems ).not.toContain( "myElem" );  // orig YUI Test err msg: "elems should not contain myElem"' );
			} );
			
			
			it( "should properly convert Y.ArrayAssert.containsItems() assertions", function() {
				expect( converter.convertAssertions( 'Y.ArrayAssert.containsItems( [ "a", "b" ], elems );' ) )
					.to.equal( 'expect( _.intersection( [ "a", "b" ], elems ).length ).toBe( [ "a", "b" ].length );' );
				
				expect( converter.convertAssertions( 'Y.ArrayAssert.containsItems( myEls, elems );' ) )
					.to.equal( 'expect( _.intersection( myEls, elems ).length ).toBe( myEls.length );' );
				
				expect( converter.convertAssertions( 'Y.ArrayAssert.containsItems( [ "a", "b" ], elems, "elems should contain a and b" );' ) )
					.to.equal( 'expect( _.intersection( [ "a", "b" ], elems ).length ).toBe( [ "a", "b" ].length );  // orig YUI Test err msg: "elems should contain a and b"' );
			} );
			
			
			it( "should properly convert Y.ArrayAssert.itemsAreSame() assertions", function() {
				expect( converter.convertAssertions( 'Y.ArrayAssert.itemsAreSame( [ "attr1", "attr2" ], attrs );' ) )
					.to.equal( 'expect( attrs ).toEqual( [ "attr1", "attr2" ] );' );
				
				expect( converter.convertAssertions( 'Y.ArrayAssert.itemsAreSame( [ "attr1", "attr2" ], attrs, "attrs should be attr1 and attr2" );' ) )
					.to.equal( 'expect( attrs ).toEqual( [ "attr1", "attr2" ] );  // orig YUI Test err msg: "attrs should be attr1 and attr2"' );
			} );
			
			
			it( "should properly convert Y.ArrayAssert.isEmpty() assertions", function() {
				expect( converter.convertAssertions( 'Y.ArrayAssert.isEmpty( attrs );' ) )
					.to.equal( 'expect( attrs ).toEqual( [] );' );
				
				expect( converter.convertAssertions( 'Y.ArrayAssert.isEmpty( attrs, "attrs should be empty" );' ) )
					.to.equal( 'expect( attrs ).toEqual( [] );  // orig YUI Test err msg: "attrs should be empty"' );
			} );
			
		} );
		
		
		describe( "Y.ObjectAssert package assertions", function() {
			
			it( "should properly convert Y.ObjectAssert.hasKey() assertions", function() {
				expect( converter.convertAssertions( 'Y.ObjectAssert.hasKey( "attr1", data );' ) )
					.to.equal( 'expect( data.hasOwnProperty( "attr1" ) ).toBe( true );' );
				
				expect( converter.convertAssertions( 'Y.ObjectAssert.hasKey( "attr1", data, "data should have attr1" );' ) )
					.to.equal( 'expect( data.hasOwnProperty( "attr1" ) ).toBe( true );  // orig YUI Test err msg: "data should have attr1"' );
			} );
			
			it( "should properly convert Y.ObjectAssert.ownsKeys() assertions", function() {
				expect( converter.convertAssertions( 'Y.ObjectAssert.ownsKeys( [ "attr1", "attr2" ], data );' ) )
					.to.equal( 'expect( data.hasOwnProperty( "attr1" ) ).toBe( true );expect( data.hasOwnProperty( "attr2" ) ).toBe( true );' );
				
				expect( converter.convertAssertions( 'Y.ObjectAssert.ownsKeys( [ "attr1", "attr2" ], data, "data should have attr1 and attr2" );' ) )
					.to.equal( 'expect( data.hasOwnProperty( "attr1" ) ).toBe( true );expect( data.hasOwnProperty( "attr2" ) ).toBe( true );  // orig YUI Test err msg: "data should have attr1 and attr2"' );
			} );
			
			it( "should properly convert Y.ObjectAssert.hasKeys() assertions", function() {
				expect( converter.convertAssertions( 'Y.ObjectAssert.hasKeys( [ "attr1", "attr2" ], data );' ) )
					.to.equal( 'expect( data.hasOwnProperty( "attr1" ) ).toBe( true );expect( data.hasOwnProperty( "attr2" ) ).toBe( true );' );
				
				expect( converter.convertAssertions( 'Y.ObjectAssert.hasKeys( [ "attr1", "attr2" ], data, "data should have attr1 and attr2" );' ) )
					.to.equal( 'expect( data.hasOwnProperty( "attr1" ) ).toBe( true );expect( data.hasOwnProperty( "attr2" ) ).toBe( true );  // orig YUI Test err msg: "data should have attr1 and attr2"' );
			} );
			
		} );
		
	} );
	
	
	
	// -----------------------------------
	
	
	
	
	
	
	// -----------------------------------------------
	
	
	describe( "complete conversion tests", function() {
	
		it( "should convert a fairly simple Ext.Test file", function() {
			var input = fs.readFileSync( __dirname + '/fixture/simple_input.js', 'utf8' ),
			    expectedOutput = fs.readFileSync( __dirname + '/fixture/simple_expectedOutput.js', 'utf8' );
			
			// Strip all carriage returns off of the input and expected output. They needlessly get in the way.
			input = input.replace( /\r/g, '' );
			expectedOutput = expectedOutput.replace( /\r/g, '' );
			
			var convertedInput = converter.convert( input );
			expect( convertedInput ).to.equal( expectedOutput );
		} );
	
		
		it( "should convert JsMockito try/catch blocks in a file", function() {
			var input = fs.readFileSync( __dirname + '/fixture/jsMockitoTests_input.js', 'utf8' ),
			    expectedOutput = fs.readFileSync( __dirname + '/fixture/jsMockitoTests_expectedOutput.js', 'utf8' );
			
			// Strip all carriage returns off of the input and expected output. They needlessly get in the way.
			input = input.replace( /\r/g, '' );
			expectedOutput = expectedOutput.replace( /\r/g, '' );
			
			var convertedInput = converter.convert( input );
			expect( convertedInput ).to.equal( expectedOutput );
		} );
	
		
		it( "should convert setUp() and tearDown() methods in a file", function() {
			var input = fs.readFileSync( __dirname + '/fixture/setUpAndTearDown_input.js', 'utf8' ),
			    expectedOutput = fs.readFileSync( __dirname + '/fixture/setUpAndTearDown_expectedOutput.js', 'utf8' );
			
			// Strip all carriage returns off of the input and expected output. They needlessly get in the way.
			input = input.replace( /\r/g, '' );
			expectedOutput = expectedOutput.replace( /\r/g, '' );
			
			var convertedInput = converter.convert( input );
			expect( convertedInput ).to.equal( expectedOutput );
		} );
	
	} );
	
} );