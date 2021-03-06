/*global require, __dirname, describe, xdescribe, beforeEach, afterEach, it, xit */
/*jshint sub:true */
var expect           = require( 'chai' ).expect,
    fs               = require( 'fs' ),
    Parser           = require( '../src/Parser' ),
    ParseResult      = require( '../src/ParseResult' ),
    SuiteNode        = require( '../src/node/Suite' ),
    TestCaseNode     = require( '../src/node/TestCase' ),
    DiTestCaseNode   = require( '../src/node/DiTestCase' ),
    ShouldNode       = require( '../src/node/Should' ),
    SetUpNode        = require( '../src/node/SetUp' ),
    TearDownNode     = require( '../src/node/TearDown' ),
    TestNode         = require( '../src/node/Test' ),
    HelperMethodNode = require( '../src/node/HelperMethod' );


describe( "Parser", function() {
	
	describe( "static methods", function() {
		
		describe( "findMatchingClosingBrace()", function() {
		
			it( "should throw an error if the character at the given index is not an opening curly or square brace", function() {
				expect( function() {
					Parser.findMatchingClosingBrace( "asdf", 0 );
				} ).to.Throw( Error, "Character at idx 0 of input string was not an open brace. Found: 'a' instead" );
			} );
			
			
			it( "should find the index of the matching curly brace in a simple scenario", function() {
				var input = "{ var test = '1'; }",
				    closeBraceIdx = Parser.findMatchingClosingBrace( input, 0 );
				
				expect( closeBraceIdx ).to.equal( 18 );
			} );
			
			
			it( "should find the index of the matching square brace in a simple scenario", function() {
				var input = "[ 1, 2, 3 ]",
				    closeBraceIdx = Parser.findMatchingClosingBrace( input, 0 );
				
				expect( closeBraceIdx ).to.equal( 10 );
			} );
			
			
			it( "should find the index of the matching outer square brace in a  a nested square brace scenario", function() {
				var input = "var a = [ 1, 2, [ 3, 4 ], { a: b } ];",
				    closeBraceIdx = Parser.findMatchingClosingBrace( input, 8 );  // start at the first square brace
				
				expect( closeBraceIdx ).to.equal( input.length - 2 );  // 2 chars from the end
			} );
			
			
			it( "should find the index of the matching inner square brace in a nested square brace scenario", function() {
				var input = "var a = [ 1, 2, [ 3, 4 ], { a: b } ];",
				    closeBraceIdx = Parser.findMatchingClosingBrace( input, 16 );  // start at the first square brace
				
				expect( closeBraceIdx ).to.equal( 23 );
			} );
			
			
			it( "should find the correct matching square brace, even if there are square braces in a single quote string", function() {
				var input = "var a = [ 'some string ]', 'another []]]]]] string' ];",
				    closeBraceIdx = Parser.findMatchingClosingBrace( input, 8 );  // start at the first square brace
				
				expect( closeBraceIdx ).to.equal( input.length - 2 );  // 2 chars from the end
			} );
			
			
			it( "should find the correct matching square brace, even if there are square braces in a double quote string", function() {
				var input = 'var a = [ "some string ]", "another []]]]]] string" ];',
				    closeBraceIdx = Parser.findMatchingClosingBrace( input, 8 );  // start at the first square brace
				
				expect( closeBraceIdx ).to.equal( input.length - 2 );  // 2 chars from the end
			} );
			
			
			it( "should find the correct matching square brace, even if there are braces in a string literal with escaped quotes", function() {
				var input = 'var a = [ "some \\"string ]", "anoth\\"er []]]]]] str\\"ing" ];',
				    closeBraceIdx = Parser.findMatchingClosingBrace( input, 8 );  // start at the first square brace
				
				expect( closeBraceIdx ).to.equal( input.length - 2 );  // 2 chars from the end
			} );
			
			
			it( "should find the correct matching square brace, even if there are braces in a RegExp literal with escaped slashes", function() {
				var input = '[ "abcd", /abc[\\]]def/ ]',
				    closeBraceIdx = Parser.findMatchingClosingBrace( input, 0 );  // start at the first square brace
				
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
				
				var closeBraceIdx = Parser.findMatchingClosingBrace( input, 8 );  // start at the first square brace
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
				
				var closeBraceIdx = Parser.findMatchingClosingBrace( input, 0 );
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
				
				var closeBraceIdx = Parser.findMatchingClosingBrace( input, 0 );
				expect( closeBraceIdx ).to.equal( input.length - 1 );  // Last char in the input
			} );
			
			
			it( "should throw an error if the end of the string is reached before finding the matching end brace", function() {
				var input = "[ 1, 2, 3";
				
				expect( function() {
					Parser.findMatchingClosingBrace( input, 0 );
				} ).to.Throw( Error, "A match for the opening brace '[' at index 0 was not found. End of input reached." );
			} );
			
		} );
		
		
		describe( "findMatchingClosingLiteral()", function() {
			
			it( "should find a simple matching single quote", function() {
				var input = "var a = 'testStr';";
				var closeLiteralIdx = Parser.findMatchingClosingLiteral( input, 8 );  // quote starts at char index 8
				
				expect( closeLiteralIdx ).to.equal( input.length - 2 );  // second to last char
			} );
			
			
			it( "should find a simple matching double quote", function() {
				var input = 'var a = "testStr";';
				var closeLiteralIdx = Parser.findMatchingClosingLiteral( input, 8 );  // quote starts at char index 8
				
				expect( closeLiteralIdx ).to.equal( input.length - 2 );  // second to last char
			} );
			
			
			it( "should find a simple matching regexp delimiter", function() {
				var input = 'var a = /testStr/;';
				var closeLiteralIdx = Parser.findMatchingClosingLiteral( input, 8 );  // slash starts at char index 8
				
				expect( closeLiteralIdx ).to.equal( input.length - 2 );  // second to last char
			} );
			
		} );
		
		
		describe( "findMatchingEndComment()", function() { 
			
			it( "should throw an error if the index provided was not a beginning comment sequence", function() {
				expect( function() {
					Parser.findMatchingEndComment( "asdf", 0 );
				} ).to.Throw( Error, "Character at idx 0 of input string was not an opening comment character. Found: `a` instead" );
				
				expect( function() {
					// Starting with a slash, but not following with another slash or an asterisk
					Parser.findMatchingEndComment( "/sdf", 0 );
				} ).to.Throw( Error, "Character at idx 0 of input string was not an opening comment character. Found: `/s` instead" );
			} );
			
			
			it( "should find the line break after a single line comment that starts at the beginning of a line", function() {
				var input = [
					'asdf\n',
					'// hola\n',
					'fdsa\n'
				].join( "" );
				
				expect( Parser.findMatchingEndComment( input, 5 ) ).to.equal( 12 );
			} );
			
			
			it( "should find the line break after a single line comment that doesn't start at the beginning of a line", function() {
				var input = [
					'asdf\n',
					'qwer // hola\n',
					'fdsa\n'
				].join( "" );
				
				expect( Parser.findMatchingEndComment( input, 10 ) ).to.equal( 17 );
			} );
			
			
			it( "should find the line break after a single line comment which has a multiline comment beginning sequence within it", function() {
				var input = [
					'asdf\n',
					'// hola/*amigos \n',
					'fdsa\n'
				].join( "" );
				
				var endCharPos = Parser.findMatchingEndComment( input, 5 );
				expect( endCharPos ).to.equal( 21 );
				expect( input.charAt( endCharPos ) ).to.equal( "\n" );
			} );
			
			
			it( "should find the end of a multi-line comment which exists on a single line", function() {
				var input = [
					'asdf\n',
					'/* hola */amigos \n',
					'fdsa\n'
				].join( "" );
				
				var endCharPos = Parser.findMatchingEndComment( input, 5 );
				expect( endCharPos ).to.equal( 15 );
				expect( input.charAt( endCharPos ) ).to.equal( "a" );  // start of "amigos"
			} );
			
			
			it( "should find the end of a multi-line comment which exists on multiple lines", function() {
				var input = [
					'asdf',
					'/* hola amigos',
					'fd*/friends'
				].join( "\n" );
				
				var endCharPos = Parser.findMatchingEndComment( input, 5 );
				expect( endCharPos ).to.equal( 24 );
				expect( input.charAt( endCharPos ) ).to.equal( "f" );  // start of "friends"
			} );
			
			
			it( "should find the end of the *first* multi-line comment, when two are back-to-back", function() {
				var input = [
					'/* hola *//* amigo */'
				].join( "" );
				
				var endCharPos = Parser.findMatchingEndComment( input, 0 );
				expect( endCharPos ).to.equal( 10 );
				expect( input.charAt( endCharPos ) ).to.equal( "/" );  // start of second multiline comment
			} );
			
			
			it( "should find the end of a multi-line comment that ends at the end of the string", function() {
				var input = [
					'/* hola */'
				].join( "" );
				
				var endCharPos = Parser.findMatchingEndComment( input, 0 );
				expect( endCharPos ).to.equal( input.length );
			} );
			
			
			it( "should throw an error for a multi-line comment which doesn't have an end sequence", function() {
				var input = [
					'asdf\n',
					'/* hola amigos \n',
					'fdsa'
				].join( "" );
				
				expect( function() {
					Parser.findMatchingEndComment( input, 5 );
				} ).to.Throw( Error, "A match for the opening multi-line comment at index 5 was not found. End of input reached." );
			} );
			
		} );
		
		
		describe( "parseArgsStr()", function() {
		
			it( "should parse simple args", function() {
				var input = "arg1, arg2, arg3";
				expect( Parser.parseArgsStr( input ) ).to.deep.equal( [ 'arg1', 'arg2', 'arg3' ] );
			} );
			
			
			it( "should parse simple args with a string literal", function() {
				var input = 'arg1, "arg1 should have been something"';
				expect( Parser.parseArgsStr( input ) ).to.deep.equal( [ 'arg1', '"arg1 should have been something"' ] );
			} );
			
			
			it( "should parse complex args with a function call", function() {
				var input = "arg1( arg2, arg3 ), arg4, arg5";
				expect( Parser.parseArgsStr( input ) ).to.deep.equal( [ 'arg1( arg2, arg3 )', 'arg4', 'arg5' ] );
			} );
			
			
			it( "should parse complex args with an array literal", function() {
				var input = "[ arg1, arg2, arg3 ], arg4, arg5";
				expect( Parser.parseArgsStr( input ) ).to.deep.equal( [ '[ arg1, arg2, arg3 ]', 'arg4', 'arg5' ] );
			} );
			
			
			it( "should parse complex args with an object literal", function() {
				var input = "{ a: arg1, b: arg2, c: arg3 }, arg4, arg5";
				expect( Parser.parseArgsStr( input ) ).to.deep.equal( [ '{ a: arg1, b: arg2, c: arg3 }', 'arg4', 'arg5' ] );
			} );
			
			it( "should parse complex args with strings that have braces in them", function() {
				var input = "{ a: '}arg1)', b: arg2, c: arg3 }, 'arg4}])', arg5";
				expect( Parser.parseArgsStr( input ) ).to.deep.equal( [ "{ a: '}arg1)', b: arg2, c: arg3 }", "'arg4}])'", 'arg5' ] );
			} );
			
		} );
		
	} );
	
	
	
	// -----------------------------------
	
	
	describe( "parse()", function() {
		
		it( "should parse input with an outer test Suite, and return a ParseResult", function() {
			var input = [
				'tests.unit.thePackage.add( new Ext.test.TestSuite( {',
				'    name: "TheClass",',
				'    items : [',
				'        {',
				'            name : "method() test case",',
				'            "something should happen" : function() {',
				'                var a = 1;',
				'            },',
				'            "something else should happen" : function() {',
				'                var b = 2;',
				'            }',
				'        }',
				'    ]',
				'} ) );'
			].join( "\n" );
			
			var parser = new Parser( input ),
			    parseResult = parser.parse();
			
			expect( parseResult ).to.be.instanceOf( ParseResult );
			expect( parseResult.getParseTree() ).to.be.instanceOf( SuiteNode );
			expect( parseResult.getStartIdx() ).to.equal( 0 );
			expect( parseResult.getEndIdx() ).to.equal( input.length );
			expect( parseResult.getIndentLevel() ).to.equal( 0 );
			
			var suite = parseResult.getParseTree();
			expect( suite.getName() ).to.equal( "unit.thePackage.TheClass" );
			expect( suite.getChildren().length ).to.equal( 1 );
			expect( suite.getChildren()[ 0 ].getName() ).to.equal( "method() test case" );
			expect( suite.getChildren()[ 0 ].getTests().length ).to.equal( 2 );
		} );
		
		
		it( "should parse input with an outer TestCase", function() {
			var input = [
				'tests.unit.thePackage.add( new Ext.test.TestCase( {',
				'    name: "TheClass",',
				'    setUp : function() {',
				'        this.a = 1;',
				'        this.b = 1;',
				'    },',
				'    ',
				'    tearDown : function() {',
				'        this.a.destroy();',
				'        this.b.destroy();',
				'    },',
				'    ',
				'    _should : {',
				'        ignore : {',
				'            "test_something" : true,',
				'            "something should happen" : true  // some comment',
				'        },',
				'        /* some comment */',
				'        error : {',
				'            "test_somethingElse" : "some error",',
				'            "something else should happen" : ',
				'                "some super-long error message"',
				'        }',
				'    },',
				'    ',
				'    ',
				'    "something should happen" : function() {',
				'        Y.Assert.areSame( 1, 1 );',
				'    },',
				'    ',
				'    "something else should happen" : function() {',
				'        Y.Assert.areSame( 1, 2 );',
				'    },',
				'    ',
				'    test_something : function() {',
				'        Y.Assert.areSame( 1, 3 );',
				'    },',
				'    ',
				'    // Some comment',
				'    test_somethingElse : function() {',
				'        Y.Assert.areSame( 1, 4 );',
				'    }',
				'    ',
				'    "something worthy of mordor should happen" : function() {',
				'        Y.Assert.areSame( 1, 5 );',
				'    }',
				'} ) );'
			].join( "\n" );
			
			var parser = new Parser( input ),
			    parseResult = parser.parse();
			
			expect( parseResult ).to.be.instanceOf( ParseResult );
			expect( parseResult.getParseTree() ).to.be.instanceOf( TestCaseNode );
			expect( parseResult.getStartIdx() ).to.equal( 0 );
			expect( parseResult.getEndIdx() ).to.equal( input.length );
			expect( parseResult.getIndentLevel() ).to.equal( 0 );
			
			
			
			// Note: Same tests as parseOuterTestCase(), but checking here as well just in case
			var testCaseNode = parseResult.getParseTree();
			expect( testCaseNode.getName() ).to.equal( "unit.thePackage.TheClass" );
			
			expect( testCaseNode.getSetUp() ).to.not.equal( null );
			expect( testCaseNode.getSetUp().getBody() ).to.match( /this\.a = 1;/ );
			expect( testCaseNode.getSetUp().getBody() ).to.match( /this\.b = 1;/ );
			
			expect( testCaseNode.getTearDown() ).to.not.equal( null );
			expect( testCaseNode.getTearDown().getBody() ).to.match( /this\.a\.destroy\(\);/ );
			expect( testCaseNode.getTearDown().getBody() ).to.match( /this\.b\.destroy\(\);/ );
			
			// "Should" rules assertions
			var should = testCaseNode.getShould();
			expect( should ).to.not.equal( null );
			expect( should.getIgnoredTests() ).to.not.equal( null );
			expect( should.getIgnoredTests()[ 'test_something' ] ).to.equal( true );
			expect( should.getIgnoredTests()[ 'something should happen' ] ).to.equal( true );
			expect( should.getErrorTests()[ 'test_somethingElse' ] ).to.equal( "some error" );
			expect( should.getErrorTests()[ 'something else should happen' ] ).to.equal( "some super-long error message" );
			
			// Tests Assertions
			var tests = testCaseNode.getTests();
			expect( tests.length ).to.equal( 5 );
			expect( tests[ 0 ].getName() ).to.equal( "something should happen" );
			expect( tests[ 1 ].getName() ).to.equal( "something else should happen" );
			expect( tests[ 2 ].getName() ).to.equal( "something" );
			expect( tests[ 3 ].getName() ).to.equal( "somethingElse" );
			expect( tests[ 4 ].getName() ).to.equal( "something worthy of mordor should happen" );
			
			expect( parser.currentPos ).to.equal( input.length );  // currentPos should have been advanced to past the TestCase
		} );
		
		
		it( "should report the correct indent level of an outer Suite", function() {
			var input = [
				'\ttests.unit.thePackage.add( new Ext.test.TestSuite( {',
				'\t\tname: "TheClass",',
				'\t\titems : [',
				'\t\t\t{',
				'\t\t\t\tname : "method() test case",',
				'\t\t\t\t"something should happen" : function() {',
				'\t\t\t\t\tvar a = 1;',
				'\t\t\t\t},',
				'\t\t\t},',
				'\t\t]',
				'\t} ) );'
			].join( "\n" );
			
			var parser = new Parser( input ),
			    parseResult = parser.parse();
			
			expect( parseResult.getIndentLevel() ).to.equal( 1 );
		} );
		
		
		it( "should report the correct indent level of an outer TestCase", function() {
			var input = [
				'\ttests.unit.thePackage.add( new Ext.test.TestCase( {',
				'\t\tname: "TheClass",',
				'\t\t',
				'\t\t"something should happen" : function() {',
				'\t\t\tY.Assert.areSame( 1, 1 );',
				'\t\t}',
				'\t} ) );'
			].join( "\n" );
			
			var parser = new Parser( input ),
			    parseResult = parser.parse();
			
			expect( parseResult.getIndentLevel() ).to.equal( 1 );
		} );
		
		
		it( "should throw an error if the input does not have an outer Suite or TestCase", function() {
			var input = [
				'asdfasdfasfd',
				'    name: "TheClass",',
				'    items : [',
				'        {',
				'            name : "method() test case",',
				'            "something should happen" : function() {',
				'                var a = 1;',
				'            },',
				'            "something else should happen" : function() {',
				'                var b = 2;',
				'            }',
				'        }',
				'    ]',
				'zzzzzzzzzzzz'
			].join( "\n" );
			
			var parser = new Parser( input );
			expect( function() {
				parser.parse();
			} ).to.Throw( "No outer Ext.Test Suite or TestCase found" );
		} );
		
	} );
	
	
	describe( "determineIndentLevel()", function() {
		
		it( "should return 0 when given no whitespace", function() {
			var parser = new Parser( "Testing 123" );  // argument ignored in this test
			
			expect( parser.determineIndentLevel( "" ) ).to.equal( 0 );
		} );
		
		
		it( "should return the number of tabs, when tabs are used for indenting", function() {
			var parser = new Parser( "Testing 123" );  // argument ignored in this test
			
			expect( parser.determineIndentLevel( "\t" ) ).to.equal( 1 );
			expect( parser.determineIndentLevel( "\t\t\t" ) ).to.equal( 3 );
		} );
		
		
		it( "should return the number of spaces / 4, when spaces are used for indenting", function() {
			var parser = new Parser( "Testing 123" );  // argument ignored in this test
			
			expect( parser.determineIndentLevel( "    " ) ).to.equal( 1 );
			expect( parser.determineIndentLevel( "        " ) ).to.equal( 2 );
			expect( parser.determineIndentLevel( "            " ) ).to.equal( 3 );
		} );
		
	} );
	
	
	
	describe( "parseOuterSuite()", function() {
		
		it( "should parse an outer suite", function() {
			var input = [
				'tests.unit.thePackage.add( new Ext.test.TestSuite( {',
				'    name: "TheClass",',
				'    items : [',
				'        {',
				'            name : "method() test case",',
				'            "something should happen" : function() {',
				'                var a = 1;',
				'            },',
				'            "something else should happen" : function() {',
				'                var b = 2;',
				'            }',
				'        }',
				'    ]',
				'} ) );'
			].join( "\n" );
			
			var parser = new Parser( input ),
			    suite = parser.parseOuterSuite();
			
			expect( suite ).to.be.instanceOf( SuiteNode );
			expect( suite.getName() ).to.equal( "unit.thePackage.TheClass" );
			
			expect( suite.getChildren().length ).to.equal( 1 );
			expect( suite.getChildren()[ 0 ].getName() ).to.equal( "method() test case" );
			expect( suite.getChildren()[ 0 ].getTests().length ).to.equal( 2 );
			
			expect( parser.currentPos ).to.equal( input.length );  // currentPos should have been advanced to past the Suite
		} );
		
		
		it( "should parse an outer suite with quotes in the name", function() {
			var input = [
				'tests.unit.thePackage.add( new Ext.test.TestSuite( {',
				'    name: "TheClass \'is\' this test",',
				'    items : [',
				'        {',
				'            name : "method() test case",',
				'            "something should happen" : function() {',
				'                var a = 1;',
				'            },',
				'            "something else should happen" : function() {',
				'                var b = 2;',
				'            }',
				'        }',
				'    ]',
				'} ) );'
			].join( "\n" );
			
			var parser = new Parser( input ),
			    suite = parser.parseOuterSuite();
			
			expect( suite ).to.be.instanceOf( SuiteNode );
			expect( suite.getName() ).to.equal( "unit.thePackage.TheClass 'is' this test" );
			
			expect( suite.getChildren().length ).to.equal( 1 );
			expect( suite.getChildren()[ 0 ].getName() ).to.equal( "method() test case" );
			expect( suite.getChildren()[ 0 ].getTests().length ).to.equal( 2 );
			
			expect( parser.currentPos ).to.equal( input.length );  // currentPos should have been advanced to past the Suite
		} );
		
		
		it( "should parse an outer suite *that is really a TestCase*, returning a TestCase node in this situation", function() {
			var input = [
				'tests.unit.thePackage.add( new Ext.test.TestSuite( {',
				'    name: "TheClass",',
				'    ',
				'    "something should happen" : function() {',
				'        var a = 1;',
				'    },',
				'    "something else should happen" : function() {',
				'        var a = 2;',
				'    }',
				'} ) );'
			].join( "\n" );
			
			var parser = new Parser( input ),
			    suite = parser.parseOuterSuite();
			
			expect( suite ).to.be.instanceOf( TestCaseNode );
			expect( suite.getName() ).to.equal( "unit.thePackage.TheClass" );
			
			expect( suite.getTests().length ).to.equal( 2 );
			expect( suite.getTests()[ 0 ].getName() ).to.equal( "something should happen" );
			expect( suite.getTests()[ 1 ].getName() ).to.equal( "something else should happen" );
			
			expect( parser.currentPos ).to.equal( input.length );  // currentPos should have been advanced to past the Suite
		} );
		
		
		it( "should parse an outer suite that is defined with an object literal, instead of `new Ext.test.Suite()`", function() {
			var input = [
				'tests.unit.thePackage.add( {',
				'    name: "TheClass",',
				'    items : [',
				'        {',
				'            name : "method() test case",',
				'            "something should happen" : function() {',
				'                var a = 1;',
				'            },',
				'            "something else should happen" : function() {',
				'                var b = 2;',
				'            }',
				'        }',
				'    ]',
				'} );'
			].join( "\n" );
			
			var parser = new Parser( input ),
			    suite = parser.parseOuterSuite();
			
			expect( suite ).to.be.instanceOf( SuiteNode );
			expect( suite.getName() ).to.equal( "unit.thePackage.TheClass" );
			
			expect( suite.getChildren().length ).to.equal( 1 );
			expect( suite.getChildren()[ 0 ].getName() ).to.equal( "method() test case" );
			expect( suite.getChildren()[ 0 ].getTests().length ).to.equal( 2 );
			
			expect( parser.currentPos ).to.equal( input.length );  // currentPos should have been advanced to past the Suite
		} );
		
	} );
	
	
	
	describe( "parseOuterTestCase()", function() {
		
		it( "should parse an outer test case", function() {
			var input = [
				'tests.unit.thePackage.add( new Ext.test.TestCase( {',
				'    name: "TheClass",',
				'    setUp : function() {',
				'        this.a = 1;',
				'        this.b = 1;',
				'    },',
				'    ',
				'    tearDown : function() {',
				'        this.a.destroy();',
				'        this.b.destroy();',
				'    },',
				'    ',
				'    ',
				'    // --------------------------------',    // a comment that should be ignored
				'    ',
				'    ',
				'    _should : {',
				'        ignore : {',
				'            "test_something" : true,',
				'            "something should happen" : true',
				'        },',
				'        error : {',
				'            "test_somethingElse" : "some error",',
				'            "something else should happen" : ',
				'                "some super-long error message"',
				'        }',
				'    },',
				'    ',
				'    ',
				'    /* blah blah',        // another comment
				'       blah blah */',     // that should be ignored
				'    ',
				'    ',
				'    someHelper : function() {',
				'        return "helper method";',
				'    },',
				'    ',
				'    someOtherHelper : function() {',
				'        return "helper method 2";',
				'    },',
				'    ',
				'    "something should happen" : function() {',
				'        Y.Assert.areSame( 1, 1 );',
				'    },',
				'    ',
				'    "something else should happen" : function() {',
				'        Y.Assert.areSame( 1, 2 );',
				'    },',
				'    ',
				'    test_something : function() {',
				'        Y.Assert.areSame( 1, 3 );',
				'    },',
				'    ',
				'    test_somethingElse : function() {',
				'        Y.Assert.areSame( 1, 4 );',
				'    }',
				'    ',
				'    "something worthy of mordor should happen" : function() {',
				'        Y.Assert.areSame( 1, 5 );',
				'    }',
				'} ) );'
			].join( "\n" );
			
			var parser = new Parser( input ),
			    testCaseNode = parser.parseOuterTestCase();
			
			expect( testCaseNode.getName() ).to.equal( "unit.thePackage.TheClass" );
			
			expect( testCaseNode.getSetUp() ).to.not.equal( null );
			expect( testCaseNode.getSetUp().getBody() ).to.match( /this\.a = 1;/ );
			expect( testCaseNode.getSetUp().getBody() ).to.match( /this\.b = 1;/ );
			
			expect( testCaseNode.getTearDown() ).to.not.equal( null );
			expect( testCaseNode.getTearDown().getBody() ).to.match( /this\.a\.destroy\(\);/ );
			expect( testCaseNode.getTearDown().getBody() ).to.match( /this\.b\.destroy\(\);/ );
			
			// "Should" rules
			var should = testCaseNode.getShould();
			expect( should ).to.not.equal( null );
			expect( should.getIgnoredTests() ).to.not.equal( null );
			expect( should.getIgnoredTests()[ 'test_something' ] ).to.equal( true );
			expect( should.getIgnoredTests()[ 'something should happen' ] ).to.equal( true );
			expect( should.getErrorTests()[ 'test_somethingElse' ] ).to.equal( "some error" );
			expect( should.getErrorTests()[ 'something else should happen' ] ).to.equal( "some super-long error message" );
			
			// Tests
			var tests = testCaseNode.getTests();
			expect( tests.length ).to.equal( 5 );
			expect( tests[ 0 ].getName() ).to.equal( "something should happen" );
			expect( tests[ 1 ].getName() ).to.equal( "something else should happen" );
			expect( tests[ 2 ].getName() ).to.equal( "something" );
			expect( tests[ 3 ].getName() ).to.equal( "somethingElse" );
			expect( tests[ 4 ].getName() ).to.equal( "something worthy of mordor should happen" );
			
			// Helper methods
			var helperMethods = testCaseNode.getHelperMethods();
			expect( helperMethods.length ).to.equal( 2 );
			expect( helperMethods[ 0 ].getName() ).to.equal( "someHelper" );
			expect( helperMethods[ 1 ].getName() ).to.equal( "someOtherHelper" );
			
			expect( parser.currentPos ).to.equal( input.length );  // currentPos should have been advanced to past the TestCase
		} );
		
		
		it( "should parse an outer test case, surrounded by single quotes, with quotes in the name", function() {
			var input = [
				'tests.unit.thePackage.add( new Ext.test.TestCase( {',
				'    name: \'The \\\'best\\\' "Class"\',',
				'    setUp : function() {',
				'        this.a = 1;',
				'        this.b = 1;',
				'    }',
				'} ) );'
			].join( '\n' );
			
			var parser = new Parser( input ),
			    testCaseNode = parser.parseOuterTestCase();
			
			expect( testCaseNode.getName() ).to.equal( 'unit.thePackage.The \\\'best\\\' "Class"' );
		} );
		
		
		it( "should parse an outer test case, surrounded by double quotes, with quotes in the name", function() {
			var input = [
				'tests.unit.thePackage.add( new Ext.test.TestCase( {',
				'    name: "The \'best\' \\\"Class\\\"",',
				'    setUp : function() {',
				'        this.a = 1;',
				'        this.b = 1;',
				'    }',
				'} ) );'
			].join( '\n' );
			
			var parser = new Parser( input ),
			    testCaseNode = parser.parseOuterTestCase();
			
			expect( testCaseNode.getName() ).to.equal( "unit.thePackage.The 'best' \\\"Class\\\"" );
		} );
		
	} );
	
	
	describe( "parseSuite()", function() {
		
		it( "should return a Suite node when it finds one", function() {
			var input = [
				'tests.unit.thePackage.add( new Ext.test.TestSuite( {',
				'    name: "TheClass",',
				'    items : [',
				'        {',
				'            name  : "method() suite",',
				'            ttype : "suite"',
				'        }',
				'    ]',
				'} ) );'
			].join( "\n" );
			
			var parser = new Parser( input );
			
			// Advance parser read position to the inner suite
			var itemsMatch = /items\s*:\s*\[/.exec( input );
			parser.currentPos = itemsMatch.index + itemsMatch[ 0 ].length;
			
			var suite = parser.parseSuite();
			expect( suite ).to.be.instanceOf( SuiteNode );
			expect( suite.getName() ).to.equal( "method() suite" );
		} );
		
		
		it( "should return a Suite with nested TestCases", function() {
			var input = [
				'{',
				'    name  : "method() suite",',
				'    ttype : "suite",',
				'    items : [',
				'        {',
				'            /*',
				'             * Test the getAttributes() static method',
				'             */',
				'            name : "Test some() method"',
				'        },',
				'        {',
				'            /*',
				'             * Test the getAttributes() static method 2',
				'             */',
				'            name : "Test someOther() method"',
				'        }',
				'    ]',
				'}'
			].join( '\n' );
			
			var parser = new Parser( input ),
			    suiteNode = parser.parseSuite();
			
			expect( suiteNode ).to.not.equal( null );
			expect( suiteNode.getName() ).to.equal( "method() suite" );
			expect( suiteNode.getChildren().length ).to.equal( 2 );
			expect( suiteNode.getChildren()[ 0 ].getName() ).to.equal( "Test some() method" );
			expect( suiteNode.getChildren()[ 1 ].getName() ).to.equal( "Test someOther() method" );
		} );
		
		
		it( "should return a Suite with nested Suites and TestCases", function() {
			var input = [
				'{',
				'    name  : "method() suite",',
				'    ttype : "suite",',
				'    items : [',
				'        {',
				'            /*',
				'             * Nested Suite',
				'             */',
				'            name : "Nested Suite",',
				'            ttype: "testsuite",',
				'            items : [',
				'                {',
				'                    name: "TestCase Under Nested Suite",',
				'                    "something should happen" : function() {},',
				'                    "something else should happen" : function() {}',
				'                }',
				'            ]',
				'        },',
				'        {',
				'            /*',
				'             * TestCase',
				'             */',
				'            name : "TestCase",',
				'            "something should happen" : function() {},',
				'            "something else should happen" : function() {},',
				'            "something even more should happen" : function() {}',
				'        },',
				'        {',
				'            /*',
				'             * Nested Suite 2',
				'             */',
				'            name : "Nested Suite 2",',
				'            ttype: "testsuite",',
				'            items : [',
				'                {',
				'                    name: "TestCase Under Nested Suite 2",',
				'                    "something should happen 2" : function() {},',
				'                    "something else should happen 2" : function() {}',
				'                }',
				'            ]',
				'        },',
				'        {',
				'            /*',
				'             * Nested Suite 3',
				'             */',
				'            name : "Nested Suite 3",',
				'            ttype: "testsuite",',
				'            items : [',
				'                {',
				'                    name: "TestCase Under Nested Suite 3",',
				'                    "something should happen 3" : function() {},',
				'                    "something else should happen 3" : function() {}',
				'                }',
				'            ]',
				'        },',
				'        {',
				'            /*',
				'             * TestCase 2',
				'             */',
				'            name : "TestCase 2",',
				'            "something should happen 2" : function() {},',
				'            "something else should happen 2" : function() {},',
				'            "something even more should happen 2" : function() {}',
				'        },',
				'        {',
				'            /*',
				'             * TestCase 3',
				'             */',
				'            name : "TestCase 3",',
				'            "something should happen 3" : function() {},',
				'            "something else should happen 3" : function() {},',
				'            "something even more should happen 3" : function() {}',
				'        },',
				'    ]',
				'}'
			].join( '\n' );
			
			var parser = new Parser( input ),
			    suiteNode = parser.parseSuite();
			
			expect( suiteNode ).to.not.equal( null );
			expect( suiteNode ).to.be.instanceOf( SuiteNode );
			expect( suiteNode.getName() ).to.equal( "method() suite" );
			expect( suiteNode.getChildren().length ).to.equal( 6 );
			
			var child0 = suiteNode.getChildren()[ 0 ];
			expect( child0 ).to.be.instanceOf( SuiteNode );
			expect( child0.getName() ).to.equal( "Nested Suite" );
			expect( child0.getChildren().length ).to.equal( 1 );
			expect( child0.getChildren()[ 0 ] ).to.be.instanceOf( TestCaseNode );
			expect( child0.getChildren()[ 0 ].getName() ).to.equal( "TestCase Under Nested Suite" );
			expect( child0.getChildren()[ 0 ].getTests().length ).to.equal( 2 );
			
			var child1 = suiteNode.getChildren()[ 1 ];
			expect( child1 ).to.be.instanceOf( TestCaseNode );
			expect( child1.getName() ).to.equal( "TestCase" );
			expect( child1.getTests().length ).to.equal( 3 );
			expect( child1.getTests()[ 0 ].getName() ).to.equal( "something should happen" );
			expect( child1.getTests()[ 1 ].getName() ).to.equal( "something else should happen" );
			expect( child1.getTests()[ 2 ].getName() ).to.equal( "something even more should happen" );
			
			var child2 = suiteNode.getChildren()[ 2 ];
			expect( child2 ).to.be.instanceOf( SuiteNode );
			expect( child2.getName() ).to.equal( "Nested Suite 2" );
			expect( child2.getChildren().length ).to.equal( 1 );
			expect( child2.getChildren()[ 0 ] ).to.be.instanceOf( TestCaseNode );
			expect( child2.getChildren()[ 0 ].getName() ).to.equal( "TestCase Under Nested Suite 2" );
			expect( child2.getChildren()[ 0 ].getTests().length ).to.equal( 2 );
			
			var child3 = suiteNode.getChildren()[ 3 ];
			expect( child3 ).to.be.instanceOf( SuiteNode );
			expect( child3.getName() ).to.equal( "Nested Suite 3" );
			expect( child3.getChildren().length ).to.equal( 1 );
			expect( child3.getChildren()[ 0 ] ).to.be.instanceOf( TestCaseNode );
			expect( child3.getChildren()[ 0 ].getName() ).to.equal( "TestCase Under Nested Suite 3" );
			expect( child3.getChildren()[ 0 ].getTests().length ).to.equal( 2 );
			
			var child4 = suiteNode.getChildren()[ 4 ];
			expect( child4 ).to.be.instanceOf( TestCaseNode );
			expect( child4.getName() ).to.equal( "TestCase 2" );
			expect( child4.getTests().length ).to.equal( 3 );
			expect( child4.getTests()[ 0 ].getName() ).to.equal( "something should happen 2" );
			expect( child4.getTests()[ 1 ].getName() ).to.equal( "something else should happen 2" );
			expect( child4.getTests()[ 2 ].getName() ).to.equal( "something even more should happen 2" );
			
			var child5 = suiteNode.getChildren()[ 5 ];
			expect( child5 ).to.be.instanceOf( TestCaseNode );
			expect( child5.getName() ).to.equal( "TestCase 3" );
			expect( child5.getTests().length ).to.equal( 3 );
			expect( child5.getTests()[ 0 ].getName() ).to.equal( "something should happen 3" );
			expect( child5.getTests()[ 1 ].getName() ).to.equal( "something else should happen 3" );
			expect( child5.getTests()[ 2 ].getName() ).to.equal( "something even more should happen 3" );
		} );
		
		
		
		it( "should return null when there is not a suite node at the current character position", function() {
			var input = [
				'tests.unit.thePackage.add( new Ext.test.TestSuite( {',
				'    name: "TheClass",',
				'    items : [',
				'        {',
				'            name  : "method() test case",',
				//'          ttype : "suite",',  -- NOTE: No ttype, which means it's a TestCase, not a Suite
				'            "something should happen" : function() {',
				'                var a = 1;',
				'            }',
				'        },',
				'        {',
				'            name  : "method() test case",',
				'            ttype : "suite",',  // NOTE: This one is a Suite, but is not the one being read at the current position
				'            "something should happen" : function() {',
				'                var a = 1;',
				'            }',
				'        }',
				'    ]',
				'} ) );'
			].join( "\n" );
			
			var parser = new Parser( input );
			
			// Advance parser read position to the inner suite
			var itemsMatch = /items : \[/.exec( input );
			parser.currentPos = itemsMatch.index + itemsMatch[ 0 ].length;
			
			var suite = parser.parseSuite();
			expect( suite ).to.equal( null );
		} );
		
	} );
	
	
	describe( "parseTestCase()", function() {
		
		it( "should parse a single TestCase, with all entities, even with a quote in the name", function() {
			var input = [
				'{',
				'    /*',
				'     * Test the getAttributes() static method',
				'     */',
				'    name : "Test \'some()\' \\"special\\" method",',  // has single quotes, and escaped double quotes
				'    ',
				'    setUp : function() {',
				'        this.a = 1;',
				'        this.b = 1;',
				'    },',
				'    ',
				'    tearDown : function() {',
				'        this.a.destroy();',
				'        this.b.destroy();',
				'    },',
				'    ',
				'    _should : {',
				'        ignore : {',
				'            "test_something" : true,',
				'            "something should happen" : true',
				'        },',
				'        error : {',
				'            "test_somethingElse" : "some error",',
				'            "something else should happen" : ',
				'                "some super-long error message"',
				'        }',
				'    },',
				'    ',
				'    ',
				'    someHelperMethod : function() {',
				'        return "iHelp";',
				'    },',
				'    ',
				'    "something should happen" : function() {',
				'        Y.Assert.areSame( 1, 1 );',
				'    },',
				'    ',
				'    "something else should happen" : function() {',
				'        Y.Assert.areSame( 1, 2 );',
				'    },',
				'    ',
				'    someOtherHelperMethod : function() {',
				'        return "iAlsoHelp";',
				'    },',
				'    ',
				'    "" : function() {',
				'        return "an empty placeholder method. sometimes they exist, and should be ignored";',
				'    },',
				'    ',
				'    test_something : function() {',
				'        Y.Assert.areSame( 1, 3 );',
				'    },',
				'    ',
				'    test_somethingElse : function() {',
				'        Y.Assert.areSame( 1, 4 );',
				'    }',
				'    ',
				'    "something worthy of mordor should happen" : function() {',
				'        Y.Assert.areSame( 1, 5 );',
				'    },',
				'    ',
				'    "some test method that forgot the keyword that rhymes with could" : function() {',  // (i.e. "should")
				'        Y.Assert.areSame( 1, 4 );',
				'    }',
				'}'
			].join( "\n" );
			
			var parser = new Parser( input ),
			    testCaseNode = parser.parseTestCase();
			
			expect( testCaseNode ).to.be.instanceOf( TestCaseNode );
			expect( testCaseNode.getName() ).to.equal( "Test 'some()' \\\"special\\\" method" );
			
			expect( testCaseNode.getSetUp() ).to.not.equal( null );
			expect( testCaseNode.getSetUp().getBody() ).to.match( /this\.a = 1;/ );
			expect( testCaseNode.getSetUp().getBody() ).to.match( /this\.b = 1;/ );
			
			expect( testCaseNode.getTearDown() ).to.not.equal( null );
			expect( testCaseNode.getTearDown().getBody() ).to.match( /this\.a\.destroy\(\);/ );
			expect( testCaseNode.getTearDown().getBody() ).to.match( /this\.b\.destroy\(\);/ );
			
			// "Should" rules
			var should = testCaseNode.getShould();
			expect( should ).to.not.equal( null );
			expect( should.getIgnoredTests() ).to.not.equal( null );
			expect( should.getIgnoredTests()[ 'test_something' ] ).to.equal( true );
			expect( should.getIgnoredTests()[ 'something should happen' ] ).to.equal( true );
			expect( should.getErrorTests()[ 'test_somethingElse' ] ).to.equal( "some error" );
			expect( should.getErrorTests()[ 'something else should happen' ] ).to.equal( "some super-long error message" );
			
			// Tests
			var tests = testCaseNode.getTests();
			expect( tests.length ).to.equal( 6 );
			expect( tests[ 0 ].getName() ).to.equal( "something should happen" );
			expect( tests[ 1 ].getName() ).to.equal( "something else should happen" );
			expect( tests[ 2 ].getName() ).to.equal( "something" );
			expect( tests[ 3 ].getName() ).to.equal( "somethingElse" );
			expect( tests[ 4 ].getName() ).to.equal( "something worthy of mordor should happen" );
			expect( tests[ 5 ].getName() ).to.equal( "some test method that forgot the keyword that rhymes with could" );  // including this as a test, even though it doesn't have the keyword "should" in it.
			
			// Helper Methods
			var helperMethods = testCaseNode.getHelperMethods();
			expect( helperMethods.length ).to.equal( 2 );
			expect( helperMethods[ 0 ].getName() ).to.equal( "someHelperMethod" );
			expect( helperMethods[ 1 ].getName() ).to.equal( "someOtherHelperMethod" );
			
			expect( parser.currentPos ).to.equal( input.length );  // currentPos should have been advanced to past the TestCase
		} );
		
		
		it( "should parse a single TestCase, with no entities", function() {
			var input = [
				'{',
				'    /*',
				'     * Test the getAttributes() static method',
				'     */',
				'    name : "Test some() method"',
				'    ',
				'}'
			].join( "\n" );
			
			var parser = new Parser( input ),
			    testCaseNode = parser.parseTestCase();
			
			expect( testCaseNode ).to.be.instanceOf( TestCaseNode );
			expect( testCaseNode.getName() ).to.equal( "Test some() method" );
			expect( testCaseNode.getSetUp() ).to.equal( null );
			expect( testCaseNode.getTearDown() ).to.equal( null );
			expect( testCaseNode.getShould() ).to.equal( null );
			expect( testCaseNode.getTests().length ).to.equal( 0 );
			
			expect( parser.currentPos ).to.equal( input.length );  // currentPos should have been advanced to past the TestCase 
		} );
		
		
		
		
		it( "should parse a single TestCase that is the direct instantiation of an Ext.Test TestCase subclass, even with a quote in the name", function() {
			var input = [
				'new packageName.SomeTest( {',
				'    name : \'Test "some()" method\',',
				'    ',
				'    setUp : function() {',
				'        this.a = 1;',
				'        this.b = 1;',
				'    },',
				'    ',
				'    tearDown : function() {',
				'        this.a.destroy();',
				'        this.b.destroy();',
				'    },',
				'    ',
				'    _should : {',
				'        ignore : {',
				'            "test_something" : true,',
				'            "something should happen" : true',
				'        },',
				'        error : {',
				'            "test_somethingElse" : "some error",',
				'            "something else should happen" : ',
				'                "some super-long error message"',
				'        }',
				'    },',
				'    ',
				'    ',
				'    someHelper : function() {',
				'        return "helper method";',
				'    },',
				'    ',
				'    someOtherHelper : function() {',
				'        return "helper method 2";',
				'    },',
				'    ',
				'    "something should happen" : function() {',
				'        Y.Assert.areSame( 1, 1 );',
				'    },',
				'    ',
				'    "something else should happen" : function() {',
				'        Y.Assert.areSame( 1, 2 );',
				'    },',
				'    ',
				'    test_something : function() {',
				'        Y.Assert.areSame( 1, 3 );',
				'    },',
				'    ',
				'    test_somethingElse : function() {',
				'        Y.Assert.areSame( 1, 4 );',
				'    }',
				'    ',
				'    "something worthy of mordor should happen" : function() {',
				'        Y.Assert.areSame( 1, 5 );',
				'    }',
				'} )'
			].join( "\n" );
			
			var parser = new Parser( input ),
			    testCaseNode = parser.parseTestCase();
			
			expect( testCaseNode ).to.be.instanceOf( DiTestCaseNode );
			expect( testCaseNode.getCtorFnName() ).to.equal( "packageName.SomeTest" );
			expect( testCaseNode.getName() ).to.equal( 'Test "some()" method' );
			
			expect( testCaseNode.getSetUp() ).to.not.equal( null );
			expect( testCaseNode.getSetUp().getBody() ).to.match( /this\.a = 1;/ );
			expect( testCaseNode.getSetUp().getBody() ).to.match( /this\.b = 1;/ );
			
			expect( testCaseNode.getTearDown() ).to.not.equal( null );
			expect( testCaseNode.getTearDown().getBody() ).to.match( /this\.a\.destroy\(\);/ );
			expect( testCaseNode.getTearDown().getBody() ).to.match( /this\.b\.destroy\(\);/ );
			
			// "Should" rules
			var should = testCaseNode.getShould();
			expect( should ).to.not.equal( null );
			expect( should.getIgnoredTests() ).to.not.equal( null );
			expect( should.getIgnoredTests()[ 'test_something' ] ).to.equal( true );
			expect( should.getIgnoredTests()[ 'something should happen' ] ).to.equal( true );
			expect( should.getErrorTests()[ 'test_somethingElse' ] ).to.equal( "some error" );
			expect( should.getErrorTests()[ 'something else should happen' ] ).to.equal( "some super-long error message" );
			
			// Tests
			var tests = testCaseNode.getTests();
			expect( tests.length ).to.equal( 5 );
			expect( tests[ 0 ].getName() ).to.equal( "something should happen" );
			expect( tests[ 1 ].getName() ).to.equal( "something else should happen" );
			expect( tests[ 2 ].getName() ).to.equal( "something" );
			expect( tests[ 3 ].getName() ).to.equal( "somethingElse" );
			expect( tests[ 4 ].getName() ).to.equal( "something worthy of mordor should happen" );
			
			// Helper methods
			var helperMethods = testCaseNode.getHelperMethods();
			expect( helperMethods.length ).to.equal( 2 );
			expect( helperMethods[ 0 ].getName() ).to.equal( "someHelper" );
			expect( helperMethods[ 1 ].getName() ).to.equal( "someOtherHelper" );
			
			expect( parser.currentPos ).to.equal( input.length );  // currentPos should have been advanced to past the TestCase
		} );
		
		
		it( "should return null if a TestCase was not found at the current character read position", function() {
			var input = [
				'{',
				'    /*',
				'     * Test the some() method',
				'     */',
				'    name : "Test some() method"',
				'    ',
				'}'
			].join( "\n" );
			
			var parser = new Parser( input );
			parser.currentPos = 16;  // The word "Test" in the comment block
			
			expect( parser.parseTestCase() ).to.equal( null );
			expect( parser.currentPos ).to.equal( 16 );  // currentPos should not have been advanced
		} );
		
	} );
	
	
	describe( "parseShould()", function() {
		
		it( "should parse a 'should' block when one exists at the current position", function() {
			var input = [
				'_should : {',
				'    error : {',
				'        "test_something" : "some error",',
				'        "something should do something else" : ',
				'            "some super-long error message"',
				'    },',
				'    ignore : {',
				'        "test_someIgnoredTest" : true,',
				'        "ignored something should do something else" : true',
				'    }',
				'},'
			].join( "\n" );
			
			var parser = new Parser( input ),
			    shouldNode = parser.parseShould();
			
			expect( shouldNode ).to.be.instanceOf( ShouldNode );
			expect( shouldNode.getErrorTests() ).to.deep.equal( {
				test_something : "some error",
				"something should do something else" : "some super-long error message"
			} );
			expect( shouldNode.getIgnoredTests() ).to.deep.equal( {
				test_someIgnoredTest : true,
				"ignored something should do something else" : true
			} );
		} );
		
		
		it( "should return `null` when a 'should' block does *not* exist at the current position", function() {
			var input = [
				'setUp : function() {',
				'    this.a = 1;',
				'},',
				'_should : {',
				'    error : {',
				'        "myTest" : "someError",',
				'        "myOtherTest" : ',
				'            "some super-long error message"',
				'    },',
				'    ignore : {',
				'        "myIgnoredTest" : true,',
				'        "myOtherIgnoredTest" : true',
				'    }',
				'},'
			].join( "\n" );
			
			var parser = new Parser( input );
			var shouldNode = parser.parseShould();  // should return null - there's a "setUp" method at the starting position
			
			expect( shouldNode ).to.equal( null );
		} );
		
	} );
	
	
	describe( "parseSetUp()", function() {
		
		it( "should parse a 'setUp' method when one exists at the current position", function() {
			var input = [
				'setUp : function() {',
				'    this.a = 1;',
				'    this.b = 2;',
				'},'
			].join( "\n" );
			
			var parser = new Parser( input );
			var setUpNode = parser.parseSetUp();
			
			expect( setUpNode ).to.be.instanceOf( SetUpNode );
			expect( setUpNode.getBody() ).to.match( /this\.a = 1;/ );
			expect( setUpNode.getBody() ).to.match( /this\.b = 2;/ );
		} );
		
		
		it( "should return `null` when a 'setUp' method does *not* exist at the current position", function() {
			var input = [
				'_should : {',
				'    error : {',
				'        "myTest" : "someError",',
				'        "myOtherTest" : ',
				'            "some super-long error message"',
				'    },',
				'    ignore : {',
				'        "myIgnoredTest" : true,',
				'        "myOtherIgnoredTest" : true',
				'    }',
				'},',
				'',
				'setUp : function() {',
				'    this.a = 1;',
				'},'
			].join( "\n" );
			
			var parser = new Parser( input );
			var setUpNode = parser.parseSetUp();  // should return null - there's a "_should" block at the starting position
			
			expect( setUpNode ).to.equal( null );
		} );
		
	} );
	
	
	describe( "parseTearDown()", function() {
		
		it( "should parse a 'tearDown' method when one exists at the current position", function() {
			var input = [
				'tearDown : function() {',
				'    this.a.destroy();',
				'    this.b.destroy();',
				'},'
			].join( "\n" );
			
			var parser = new Parser( input );
			var tearDownNode = parser.parseTearDown();
			
			expect( tearDownNode ).to.be.instanceOf( TearDownNode );
			expect( tearDownNode.getBody() ).to.match( /this\.a\.destroy\(\);/ );
			expect( tearDownNode.getBody() ).to.match( /this\.b\.destroy\(\);/ );
		} );
		
		
		it( "should return `null` when a 'tearDown' method does *not* exist at the current position", function() {
			var input = [
				'_should : {',
				'    error : {',
				'        "myTest" : "someError",',
				'        "myOtherTest" : ',
				'            "some super-long error message"',
				'    },',
				'    ignore : {',
				'        "myIgnoredTest" : true,',
				'        "myOtherIgnoredTest" : true',
				'    }',
				'},',
				'',
				'tearDown : function() {',
				'    this.a = 1;',
				'},'
			].join( "\n" );
			
			var parser = new Parser( input );
			var tearDownNode = parser.parseTearDown();  // should return null - there's a "_should" block at the starting position
			
			expect( tearDownNode ).to.equal( null );
		} );
		
	} );
	
	
	
	describe( "parseTest()", function() {
		
		it( "should parse a test method when one exists at the current position (method name starting with 'test')", function() {
			var input = [
				'test_something : function() {',
				'    Y.Assert.areSame( 1, 1 );',
				'},'
			].join( "\n" );
			
			var parser = new Parser( input );
			var testNode = parser.parseTest();
			
			expect( testNode ).to.be.instanceOf( TestNode );
			expect( testNode.getName() ).to.equal( "something" );
			expect( testNode.getBody() ).to.match( /Y\.Assert\.areSame\( 1, 1 \);/ );
		} );
		
		
		it( "should parse a test method when one exists at the current position (method name with 'should' in it)", function() {
			var input = [
				'"something should happen" : function() {',
				'    Y.Assert.areSame( 1, 1 );',
				'},'
			].join( "\n" );
			
			var parser = new Parser( input );
			var testNode = parser.parseTest();
			
			expect( testNode ).to.be.instanceOf( TestNode );
			expect( testNode.getName() ).to.equal( "something should happen" );
			expect( testNode.getBody() ).to.match( /Y\.Assert\.areSame\( 1, 1 \);/ );
		} );
		
		
		it( "should return `null` when a test method does *not* exist at the current position", function() {
			var input = [
				'_should : {',
				'    error : {',
				'        "myTest" : "someError",',
				'        "myOtherTest" : ',
				'            "some super-long error message"',
				'    },',
				'    ignore : {',
				'        "myIgnoredTest" : true,',
				'        "myOtherIgnoredTest" : true',
				'    }',
				'},',
				'',
				'test_something : function() {',
				'    Y.Assert.areSame( 1, 1 );',
				'},'
			].join( "\n" );
			
			var parser = new Parser( input );
			var testNode = parser.parseTest();  // should return null - there's a "_should" block at the starting position
			
			expect( testNode ).to.equal( null );
		} );
		
	} );
	
	
	
	describe( "parseHelperMethod()", function() {
		
		it( "should parse a helper method when one exists at the current position", function() {
			var input = [
				'myHelper : function( arg1, arg2, arg3 ) {',
				'    return "iHelp";',
				'}'
			].join( "\n" );
			
			var parser = new Parser( input ),
			    helperMethodNode = parser.parseHelperMethod();
			
			expect( helperMethodNode ).to.be.instanceOf( HelperMethodNode );
			expect( helperMethodNode.getName() ).to.equal( "myHelper" );
			expect( helperMethodNode.getArgsList() ).to.equal( " arg1, arg2, arg3 " );
			expect( helperMethodNode.getBody() ).to.match( /return "iHelp";/ );
			
			expect( parser.currentPos ).to.equal( input.length );  // currentPos should have been advanced to past the helper method
		} );
		
		
		it( "should return `null` if an 'empty string method' (which acted as a placeholder) exists at the current position", function() {
			var input = [
				'"" : function() {',
				'\t',
				'},'
			].join( "\n" );
			
			var parser = new Parser( input ),
			    helperMethodNode = parser.parseHelperMethod();  // should return null - there's a "_should" block at the starting position
			
			expect( helperMethodNode ).to.equal( null );
			
			expect( parser.currentPos ).to.equal( 0 );  // currentPos shouldn't have been moved
		} );
		
		
		it( "should return `null` when a helper method does *not* exist at the current position", function() {
			var input = [
				'_should : {',
				'    error : {',
				'        "myTest" : "someError",',
				'        "myOtherTest" : ',
				'            "some super-long error message"',
				'    },',
				'    ignore : {',
				'        "myIgnoredTest" : true,',
				'        "myOtherIgnoredTest" : true',
				'    }',
				'},',
				'',
				'test_something : function() {',
				'    Y.Assert.areSame( 1, 1 );',
				'},'
			].join( "\n" );
			
			var parser = new Parser( input ),
			    helperMethodNode = parser.parseHelperMethod();  // should return null - there's a "_should" block at the starting position
			
			expect( helperMethodNode ).to.equal( null );
			
			expect( parser.currentPos ).to.equal( 0 );  // currentPos shouldn't have been moved
		} );
		
	} );
	
	
	
	describe( "parseEmptyStringPlaceholderMethod()", function() {
		
		it( "should parse an 'empty string placeholder' method when one exists at the current position", function() {
			var input = [
				'"" : function() {',
				'    ',
				'}'
			].join( "\n" );
			
			var parser = new Parser( input ),
			    result = parser.parseEmptyStringPlaceholderMethod();
			
			expect( result ).to.deep.equal( {} );
			expect( parser.currentPos ).to.equal( input.length );  // currentPos should have been advanced to past the empty method
		} );
		
		it( "should not advance the currentPos when something else is found at the current position", function() {
			var input = [
				'realHelperMethod : function() {',
				'    ',
				'}'
			].join( "\n" );
			
			var parser = new Parser( input ),
			    result = parser.parseEmptyStringPlaceholderMethod();
			
			expect( result ).to.equal( null );
			expect( parser.currentPos ).to.equal( 0 );  // currentPos should not have been advanced
		} );
		
	} );
	
	
	
	describe( "parseObjectLiteral()", function() {
		
		it( "should return the object defined by the literal", function() {
			var input = "{ a: 1, b: 'asdf' }";
			
			var parser = new Parser( input );
			parser.currentPos = 0;  // just to be clear
			
			expect( parser.parseObjectLiteral() ).to.deep.equal( { a: 1, b: 'asdf' } );
			expect( parser.currentPos ).to.equal( 19 );  // currentPos should have been advanced
		} );
		
		
		it( "should return null if the character at the currentPos is not the start of an object literal", function() {
			var input = "abcdefg { a: 1, b: 'asdf' }";
			
			var parser = new Parser( input );
			parser.currentPos = 0;  // just to be clear
			
			expect( parser.parseObjectLiteral() ).to.equal( null );
		} );
		
	} );
	
	
	describe( "parseStringLiteral()", function() {
		
		it( "should return the string literal in single quotes", function() {
			var input = "zzz 'asdf' zzz zzz";
			
			var parser = new Parser( input );
			parser.currentPos = 4;  // the quote character
			
			expect( parser.parseStringLiteral() ).to.equal( "asdf" );
			expect( parser.currentPos ).to.equal( 10 );  // currentPos should have been advanced
		} );
		
		
		it( "should return the string literal in double quotes", function() {
			var input = 'zzz "asdf" zzz zzz';
			
			var parser = new Parser( input );
			parser.currentPos = 4;  // the quote character
			
			expect( parser.parseStringLiteral() ).to.equal( "asdf" );
			expect( parser.currentPos ).to.equal( 10 );  // currentPos should have been advanced
		} );
		
		
		it( "should return null if the character at the `currentPos` is not a quote character", function() {
			var input = "asdf 'fdsa'";
			
			var parser = new Parser( input );
			parser.currentPos = 0;  // for clarity
			
			expect( parser.parseStringLiteral() ).to.equal( null );
			expect( parser.currentPos ).to.equal( 0 );  // currentPos should not have been advanced
		} );
		
	} );
	
	
	describe( "parseBooleanLiteral()", function() {
		
		it( "should return the boolean literal `true` at the currentPos", function() {
			var input = "asdf true";
			
			var parser = new Parser( input );
			parser.currentPos = 5;  // the 't' character in "true"
			
			expect( parser.parseBooleanLiteral() ).to.equal( true );
			expect( parser.currentPos ).to.equal( 9 );  // currentPos should have been advanced
		} );
		
		
		it( "should return the boolean literal `false` at the currentPos", function() {
			var input = "asdf false";
			
			var parser = new Parser( input );
			parser.currentPos = 5;  // the 'f' character in "false"
			
			expect( parser.parseBooleanLiteral() ).to.equal( false );
			expect( parser.currentPos ).to.equal( 10 );  // currentPos should have been advanced
		} );
		
		
		it( "should return null if the character at the `currentPos` is not a boolean literal", function() {
			var input = "asdf asdf";
			
			var parser = new Parser( input );
			parser.currentPos = 5;  // the '1asdf' word (not a boolean literal)
			
			expect( parser.parseBooleanLiteral() ).to.equal( null );
			expect( parser.currentPos ).to.equal( 5 );  // currentPos should not have been advanced
		} );
		
	} );
	
	
	describe( "parseIdentifier()", function() {
		
		it( "should return the identifier at the currentPos if it is a single character", function() {
			var input = "asdf z asdfasdfasdfafds";
			
			var parser = new Parser( input );
			parser.currentPos = 5;  // the 'z' character
			
			expect( parser.parseIdentifier() ).to.equal( "z" );
			expect( parser.currentPos ).to.equal( 6 );  // currentPos should have been advanced
		} );
		
		
		it( "should return the identifier at the currentPos if it is multiple characters", function() {
			var input = "asdf z123$_AAZZ asdfasdfasdfafds";
			
			var parser = new Parser( input );
			parser.currentPos = 5;  // the 'z123$_AAZZ' identifier
			
			expect( parser.parseIdentifier() ).to.equal( "z123$_AAZZ" );
			expect( parser.currentPos ).to.equal( 15 );  // currentPos should have been advanced
		} );
		
		
		it( "should return null if the character at the `currentPos` is not an identifier start character", function() {
			var input = "asdf 1asdf 'fdsa'";
			
			var parser = new Parser( input );
			parser.currentPos = 5;  // the '1asdf' word (not an identifier since it starts with the number 1)
			
			expect( parser.parseIdentifier() ).to.equal( null );
			expect( parser.currentPos ).to.equal( 5 );  // currentPos should not have been advanced
		} );
		
	} );
	
	
	describe( "skipWhitespaceAndComments()", function() {
		
		it( "should advance the `currentPos` index to the next non-whitespace character", function() {
			var input = "  asdf";
			
			var parser = new Parser( input );
			parser.currentPos = 0;  // for clarity
			
			parser.skipWhitespaceAndComments();
			expect( parser.currentPos ).to.equal( 2 );
		} );
		
		
		it( "should advance the `currentPos` index to the next character after a single line comment (which should be *after* the linebreak)", function() {
			var input = [
				'// a comment',
				'hello'
			].join( '\n' );
			
			var parser = new Parser( input );
			parser.currentPos = 0;  // for clarity
			
			parser.skipWhitespaceAndComments();
			expect( parser.currentPos ).to.equal( 13 );
			expect( input.charAt( parser.currentPos ) ).to.equal( 'h' );
		} );
		
		
		it( "should advance the `currentPos` index to the next character after a multiline comment", function() {
			var input = [
				'/* a multiline',
				'comment */asdf',
				'hello'
			].join( '\n' );
			
			var parser = new Parser( input );
			parser.currentPos = 0;  // for clarity
			
			parser.skipWhitespaceAndComments();
			expect( parser.currentPos ).to.equal( 25 );
		} );
		
		
		it( "should advance the `currentPos` index past multiple single line comments in a row", function() {
			var input = [
				'// a comment',
				'// another comment',
				'hello'
			].join( '\n' );
			
			var parser = new Parser( input );
			parser.currentPos = 0;  // for clarity
			
			parser.skipWhitespaceAndComments();
			expect( parser.currentPos ).to.equal( input.length - 5 );
			expect( input.charAt( parser.currentPos ) ).to.equal( 'h' );
		} );
		
		
		it( "should advance the `currentPos` index past multiple multi-line comments in a row", function() {
			var input = [
				'/* a comment',
				'that is long*/',
				'/* another comment',
				'that is long*/',
				'hello'
			].join( '\n' );
			
			var parser = new Parser( input );
			parser.currentPos = 0;  // for clarity
			
			parser.skipWhitespaceAndComments();
			expect( parser.currentPos ).to.equal( input.length - 5 );
			expect( input.charAt( parser.currentPos ) ).to.equal( 'h' );
		} );
		
		
		it( "should advance the `currentPos` index past multiple comments and whitespace", function() {
			var input = [
				'/* a comment',
				'that is long*/',
				'/* another comment',
				'that is long*/',
				'     ',  // some more whitespace
				'// a single ling comment',
				'hello'
			].join( '\n' );
			
			var parser = new Parser( input );
			parser.currentPos = 0;  // for clarity
			
			parser.skipWhitespaceAndComments();
			expect( parser.currentPos ).to.equal( input.length - 5 );
			expect( input.charAt( parser.currentPos ) ).to.equal( 'h' );
		} );
		
		
		it( "should not advance the `currentPos` index if it is not at a comment begin sequence or whitespace char", function() {
			var input = "asdf";
			
			var parser = new Parser( input );
			parser.currentPos = 0;
			
			parser.skipWhitespaceAndComments();
			expect( parser.currentPos ).to.equal( 0 );
		} );
		
	} );
	
	
	describe( "skipWhitespace()", function() {
		
		it( "should advance the `currentPos` index to the next non-whitespace character", function() {
			var input = "  asdf";
			
			var parser = new Parser( input );
			parser.currentPos = 0;  // for clarity
			
			parser.skipWhitespace();
			expect( parser.currentPos ).to.equal( 2 );
		} );
		
		
		it( "should not advance the `currentPos` index if it is a non-whitespace character", function() {
			var input = "asdf";
			
			var parser = new Parser( input );
			parser.currentPos = 0;
			
			parser.skipWhitespace();
			expect( parser.currentPos ).to.equal( 0 );
		} );
		
		
		it( "should advance the `currentPos` index to the end of the string, if what is left of the string is all whitespace", function() {
			var input = "asdf  ";
			
			var parser = new Parser( input );
			parser.currentPos = 4;  // the character after the 'f'
			
			parser.skipWhitespace();
			expect( parser.currentPos ).to.equal( 6 );
		} );
		
	} );
	
	
	describe( "skipComments()", function() {
		
		it( "should advance the `currentPos` index to the next character after a single line comment (which should be a linebreak)", function() {
			var input = [
				'// a comment',
				'hello'
			].join( '\n' );
			
			var parser = new Parser( input );
			parser.currentPos = 0;  // for clarity
			
			parser.skipComments();
			expect( parser.currentPos ).to.equal( 12 );
		} );
		
		
		it( "should advance the `currentPos` index to the next character after a multiline comment", function() {
			var input = [
				'/* a multiline',
				'comment */',
				'hello'
			].join( '\n' );
			
			var parser = new Parser( input );
			parser.currentPos = 0;  // for clarity
			
			parser.skipComments();
			expect( parser.currentPos ).to.equal( 25 );
		} );
		
		
		it( "should advance the `currentPos` index past multiple comments in a row", function() {
			var input = "/* asdf *//* fdsa */";
			
			var parser = new Parser( input );
			parser.currentPos = 0;  // for clarity
			
			parser.skipComments();
			expect( parser.currentPos ).to.equal( input.length );
		} );
		
		
		it( "should not advance the `currentPos` index if it is not at a comment begin sequence", function() {
			var input = "asdf";
			
			var parser = new Parser( input );
			parser.currentPos = 0;
			
			parser.skipComments();
			expect( parser.currentPos ).to.equal( 0 );
		} );
		
	} );
	
} );