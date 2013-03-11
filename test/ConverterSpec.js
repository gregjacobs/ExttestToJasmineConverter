/*global require, __dirname, describe, xdescribe, beforeEach, afterEach, it, xit */
var expect = require( 'chai' ).expect,
    fs = require( 'fs' ),
    Converter = require( '../Converter' );

describe( "Converter", function() {
	var converter;
	
	beforeEach( function() {
		converter = new Converter();
	} );
	
	describe( "convertJsHintGlobals()", function() {
		
		it( "should add the Jasmine globals to the input string when none are present", function() {
			var input = "test test test",
			    output = converter.convertJsHintGlobals( input );
			
			expect( output ).to.equal( "/*global describe, beforeEach, afterEach, it */\n" + input );
		} );
		
		
		it( "should modify existing globals, removing 'Ext', 'Y', and 'tests' globals, and adding the Jasmine ones", function() {
			var input = "/*global window, jQuery, _, Ext, Y, tests */\ntest test test",
			    output = converter.convertJsHintGlobals( input );
			
			expect( output ).to.equal( "/*global window, jQuery, _, describe, beforeEach, afterEach, it */\ntest test test" );
		} );
		
		
		it( "should modify existing globals, removing 'Ext', 'Y', and 'tests' globals, adding Jasmine ones, and moving JsMockito to the end of the list if present", function() {
			var input = "/*global window, jQuery, _, Ext, Y, JsMockito, tests */\ntest test test",
			    output = converter.convertJsHintGlobals( input );
			
			expect( output ).to.equal( "/*global window, jQuery, _, describe, beforeEach, afterEach, it, JsMockito */\ntest test test" );
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
	
	
	
	xdescribe( "convertSetupAndTeardown()", function() {
		
		it( "todo", function() {
			
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
		
	} );
	
	
	describe( "convertAssertions()", function() {
		
		describe( "Y.Assert package assertions", function() {
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
			
			
			it( "should properly convert Y.Assert.isInstanceOf() assertions", function() {
				expect( converter.convertAssertions( 'Y.Assert.isInstanceOf( SomeClass, someVar );' ) )
					.to.equal( 'expect( someVar instanceof SomeClass ).toBe( true );' );
				
				expect( converter.convertAssertions( 'Y.Assert.isInstanceOf( SomeClass, someVar, "someVar should have been an instance of SomeClass" );' ) )
					.to.equal( 'expect( someVar instanceof SomeClass ).toBe( true );  // orig YUI Test err msg: "someVar should have been an instance of SomeClass"' );
			} );
			
			
			it( "should properly convert Y.Assert.isObject() assertions", function() {
				expect( converter.convertAssertions( 'Y.Assert.isObject( someVar );' ) )
					.to.equal( 'expect( _.isObject( someVar ) ).toBe( true );' );
				
				expect( converter.convertAssertions( 'Y.Assert.isObject( someVar, "someVar should have been an object" );' ) )
					.to.equal( 'expect( _.isObject( someVar ) ).toBe( true );  // orig YUI Test err msg: "someVar should have been an object"' );
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
	
	
	describe( "findMatchingClosingBrace()", function() {
		
		it( "should throw an error if the character at the given index is not an opening curly or square brace", function() {
			expect( function() {
				converter.findMatchingClosingBrace( "asdf", 0 );
			} ).to.Throw( Error, "Character at idx 0 of input string was not an open brace. Found: 'a' instead" );
		} );
		
		
		it( "should find the index of the matching curly brace in a simple scenario", function() {
			var input = "{ var test = '1'; }",
			    closeBraceIdx = converter.findMatchingClosingBrace( input, 0 );
			
			expect( closeBraceIdx ).to.equal( 18 );
		} );
		
		
		it( "should find the index of the matching square brace in a simple scenario", function() {
			var input = "[ 1, 2, 3 ]",
			    closeBraceIdx = converter.findMatchingClosingBrace( input, 0 );
			
			expect( closeBraceIdx ).to.equal( 10 );
		} );
		
		
		it( "should find the index of the matching outer square brace in a  a nested square brace scenario", function() {
			var input = "var a = [ 1, 2, [ 3, 4 ], { a: b } ];",
			    closeBraceIdx = converter.findMatchingClosingBrace( input, 8 );  // start at the first square brace
			
			expect( closeBraceIdx ).to.equal( input.length - 2 );  // 2 chars from the end
		} );
		
		
		it( "should find the index of the matching inner square brace in a nested square brace scenario", function() {
			var input = "var a = [ 1, 2, [ 3, 4 ], { a: b } ];",
			    closeBraceIdx = converter.findMatchingClosingBrace( input, 16 );  // start at the first square brace
			
			expect( closeBraceIdx ).to.equal( 23 );
		} );
		
		
		it( "should find the correct matching square brace, even if there are square braces in a single quote string", function() {
			var input = "var a = [ 'some string ]', 'another []]]]]] string' ];",
			    closeBraceIdx = converter.findMatchingClosingBrace( input, 8 );  // start at the first square brace
			
			expect( closeBraceIdx ).to.equal( input.length - 2 );  // 2 chars from the end
		} );
		
		
		it( "should find the correct matching square brace, even if there are square braces in a double quote string", function() {
			var input = 'var a = [ "some string ]", "another []]]]]] string" ];',
			    closeBraceIdx = converter.findMatchingClosingBrace( input, 8 );  // start at the first square brace
			
			expect( closeBraceIdx ).to.equal( input.length - 2 );  // 2 chars from the end
		} );
		
		
		it( "should find the correct matching square brace, even if there are braces in a string literal with escaped quotes", function() {
			var input = 'var a = [ "some \\"string ]", "anoth\\"er []]]]]] str\\"ing" ];',
			    closeBraceIdx = converter.findMatchingClosingBrace( input, 8 );  // start at the first square brace
			
			expect( closeBraceIdx ).to.equal( input.length - 2 );  // 2 chars from the end
		} );
		
		
		it( "should find the correct matching square brace, even if there are braces in a RegExp literal with escaped slashes", function() {
			var input = '[ "abcd", /abc[\\]]def/ ]',
			    closeBraceIdx = converter.findMatchingClosingBrace( input, 0 );  // start at the first square brace
			
			expect( closeBraceIdx ).to.equal( input.length - 1 );  // 1 char from the end
		} );
		
		
		it( "should find the correct matching square brace within multiple line strings", function() {
			var input = [
				'items : [\n',
				'\tOneIndent1\n',
				'\tOneIndent2\n',
				'\t\tTwoIndent\n',
				'\tOneIndent3\n',
				']'
			].join( "" );
			
			var closeBraceIdx = converter.findMatchingClosingBrace( input, 8 );  // start at the first square brace
			expect( closeBraceIdx ).to.equal( input.length - 1 );  // Last char in the input
		} );
		
		
		it( "should find the correct matching curly brace within multiple line strings", function() {
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
			
			var closeBraceIdx = converter.findMatchingClosingBrace( input, 0 );
			expect( closeBraceIdx ).to.equal( input.length - 1 );  // Last char in the input
		} );
		
		
		it( "should find the correct matching curly brace in the face of JavaScript comments", function() {
			var input = [
				'{',
				'\t/*',
				'\t * Test something() }}}}}',
				'\t */',
				'\tname: "Test something()",',
				'\t"something should happen" : function() {',
				'\t\t// No really, something should happen here }}}}}}}}}}}',
				'\t\tvar a = 1;',
				'\t}',
				'\t/* single line comment start in a multiline comment! }}}} // }}}}*/',
				'}'
			].join( "\n" );
			
			var closeBraceIdx = converter.findMatchingClosingBrace( input, 0 );
			expect( closeBraceIdx ).to.equal( input.length - 1 );  // Last char in the input
		} );
		
		
		it( "should throw an error if the end of the string is reached before finding the matching end brace", function() {
			var input = "[ 1, 2, 3";
			
			expect( function() {
				converter.findMatchingClosingBrace( input, 0 );
			} ).to.Throw( Error, "A match for the opening brace '[' at index 0 was not found. End of input reached." );
		} );
		
	} );
	
	
	describe( "findMatchingClosingLiteral()", function() {
		
		it( "should find a simple matching single quote", function() {
			var input = "var a = 'testStr';";
			var closeLiteralIdx = converter.findMatchingClosingLiteral( input, 8 );  // quote starts at char index 8
			
			expect( closeLiteralIdx ).to.equal( input.length - 2 );  // second to last char
		} );
		
		
		it( "should find a simple matching double quote", function() {
			var input = 'var a = "testStr";';
			var closeLiteralIdx = converter.findMatchingClosingLiteral( input, 8 );  // quote starts at char index 8
			
			expect( closeLiteralIdx ).to.equal( input.length - 2 );  // second to last char
		} );
		
		
		it( "should find a simple matching regexp delimiter", function() {
			var input = 'var a = /testStr/;';
			var closeLiteralIdx = converter.findMatchingClosingLiteral( input, 8 );  // slash starts at char index 8
			
			expect( closeLiteralIdx ).to.equal( input.length - 2 );  // second to last char
		} );
		
	} );
	
	
	describe( "findMatchingEndComment()", function() { 
		
		it( "should throw an error if the index provided was not a beginning comment sequence", function() {
			expect( function() {
				converter.findMatchingEndComment( "asdf", 0 );
			} ).to.Throw( Error, "Character at idx 0 of input string was not an opening comment character. Found: `a` instead" );
			
			expect( function() {
				// Starting with a slash, but not following with another slash or an asterisk
				converter.findMatchingEndComment( "/sdf", 0 );
			} ).to.Throw( Error, "Character at idx 0 of input string was not an opening comment character. Found: `/s` instead" );
		} );
		
		
		it( "should find the line break after a single line comment that starts at the beginning of a line", function() {
			var input = [
				'asdf\n',
				'// hola\n',
				'fdsa\n'
			].join( "" );
			
			expect( converter.findMatchingEndComment( input, 5 ) ).to.equal( 12 );
		} );
		
		
		it( "should find the line break after a single line comment that doesn't start at the beginning of a line", function() {
			var input = [
				'asdf\n',
				'qwer // hola\n',
				'fdsa\n'
			].join( "" );
			
			expect( converter.findMatchingEndComment( input, 10 ) ).to.equal( 17 );
		} );
		
		
		it( "should find the line break after a single line comment which has a multiline comment beginning sequence within it", function() {
			var input = [
				'asdf\n',
				'// hola/*amigos \n',
				'fdsa\n'
			].join( "" );
			
			expect( converter.findMatchingEndComment( input, 5 ) ).to.equal( 21 );
		} );
		
		
		it( "should find the end of a multi-line comment which exists on a single line", function() {
			var input = [
				'asdf\n',
				'/* hola */ amigos \n',
				'fdsa\n'
			].join( "" );
			
			expect( converter.findMatchingEndComment( input, 5 ) ).to.equal( 14 );
		} );
		
		
		it( "should find the end of a multi-line comment which exists on multiple lines", function() {
			var input = [
				'asdf\n',
				'/* hola amigos \n',
				'fd*/sa\n'
			].join( "" );
			
			expect( converter.findMatchingEndComment( input, 5 ) ).to.equal( 24 );
		} );
		
		
		it( "should throw an error for a multi-line comment which doesn't have an end sequence", function() {
			var input = [
				'asdf\n',
				'/* hola amigos \n',
				'fdsa'
			].join( "" );
			
			expect( function() {
				converter.findMatchingEndComment( input, 5 );
			} ).to.Throw( Error, "A match for the opening multi-line comment at index 5 was not found. End of input reached." );
		} );
		
	} );
	
	
	
	describe( "parseArgsStr()", function() {
		
		it( "should parse simple args", function() {
			var input = "arg1, arg2, arg3";
			expect( converter.parseArgsStr( input ) ).to.deep.equal( [ 'arg1', 'arg2', 'arg3' ] );
		} );
		
		
		it( "should parse simple args with a string literal", function() {
			var input = 'arg1, "arg1 should have been something"';
			expect( converter.parseArgsStr( input ) ).to.deep.equal( [ 'arg1', '"arg1 should have been something"' ] );
		} );
		
		
		it( "should parse complex args with a function call", function() {
			var input = "arg1( arg2, arg3 ), arg4, arg5";
			expect( converter.parseArgsStr( input ) ).to.deep.equal( [ 'arg1( arg2, arg3 )', 'arg4', 'arg5' ] );
		} );
		
		
		it( "should parse complex args with an array literal", function() {
			var input = "[ arg1, arg2, arg3 ], arg4, arg5";
			expect( converter.parseArgsStr( input ) ).to.deep.equal( [ '[ arg1, arg2, arg3 ]', 'arg4', 'arg5' ] );
		} );
		
		
		it( "should parse complex args with an object literal", function() {
			var input = "{ a: arg1, b: arg2, c: arg3 }, arg4, arg5";
			expect( converter.parseArgsStr( input ) ).to.deep.equal( [ '{ a: arg1, b: arg2, c: arg3 }', 'arg4', 'arg5' ] );
		} );
		
		it( "should parse complex args with strings that have braces in them", function() {
			var input = "{ a: '}arg1)', b: arg2, c: arg3 }, 'arg4}])', arg5";
			expect( converter.parseArgsStr( input ) ).to.deep.equal( [ "{ a: '}arg1)', b: arg2, c: arg3 }", "'arg4}])'", 'arg5' ] );
		} );
		
	} );
	
	
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
	
	} );
	
} );