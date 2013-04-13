/*global require, module */
/*jshint boss:true */
var _              = require( 'lodash' ),
    Class          = require( './Class' ),
    SuiteNode      = require( './node/Suite' ),
    TestCaseNode   = require( './node/TestCase' ),
    DiTestCaseNode = require( './node/DiTestCase' ),
    SetUpNode      = require( './node/SetUp' ),
    TearDownNode   = require( './node/TearDown' ),
    Parser         = require( './Parser' );  // its static methods are used as utilities


/**
 * @class JasmineWriter
 * 
 * Writes out the Jasmine code for the given top level {@link node.Suite Suite} node,
 * using the {@link #write} method.
 */
var JasmineWriter = Class.extend( Object, {
	
	/**
	 * @cfg {String} indentStr
	 * 
	 * The string to use to indent. Defaults to a tab character, which is the character
	 * that anyone who really knows what they are doing uses to indent code ;)
	 */
	indentStr : '\t',
	
	/**
	 * @cfg {Number} indentLevel
	 * 
	 * The initial indent level.
	 */
	indentLevel : 0,
	
	
	/**
	 * @protected
	 * @property {String[]} output
	 * 
	 * String builder used to record the result of the transformation. Accessible via {@link #getOutput}.
	 */
	
	
	/**
	 * @constructor
	 * @param {Object} cfg The configuration options for this class.
	 */
	constructor : function( cfg ) {
		_.assign( this, cfg );
	},
	
	
	/**
	 * Writes the Jasmine output given the top level {@link node.Suite Suite} node.
	 * 
	 * @param {node.Suite/node.TestCase} outerNode The top level Suite or TestCase node to start at.
	 * @return {String} The output.
	 */
	write : function( outerNode ) {
		var outputBuffer = [];
		
		if( outerNode instanceof SuiteNode ) {
			this.appendSuite( outerNode, outputBuffer );
		} else if( outerNode instanceof TestCaseNode ) {
			this.appendTestCase( outerNode, outputBuffer );
		} else {
			throw new Error( "A `Suite` or `TestCase` node was not passed in to write()" );
		}
		
		return outputBuffer.join( "\n" );
	},
	
	
	/**
	 * Appends a string of output (which will be on a new line), automatically prepending
	 * the appropriate indent (based on the {@link #indentLevel}).
	 * 
	 * If a multiline string is passed to the `str` param, each line will receive the current
	 * level of indent.
	 * 
	 * @protected
	 * @param {String} str The line of output to append.
	 * @param {String[]} buffer The output buffer to append to.
	 */
	appendOutput : function( str, buffer ) {
		var indent = "", indentStr = this.indentStr;
		for( var i = 0, len = this.indentLevel; i < len; i++ ) {
			indent += indentStr;
		}
		
		// If the string was a multiline string, go through each line and add the indent level
		// (This also adds the indent level for a single line string as well)
		str = str
			.split( '\n' )
			.map( function( line ) {
				return indent + line;
			} )
			.join( '\n' );
		
		buffer.push( str );
	},
	
	
	// -----------------------------------
	
	
	/**
	 * Appends a {@link node.Suite Suite} node to the output.
	 * 
	 * @protected
	 * @param {node.Suite} suiteNode
	 * @param {String[]} buffer The output buffer to append to.
	 */
	appendSuite : function( suiteNode, buffer ) {
		this.appendOutput( 'describe( "' + suiteNode.getName() + '", function() {', buffer );
		this.indentLevel++;
		
		suiteNode.getChildren().forEach( function( childNode ) {
			this.appendOutput( '', buffer );  // will result in appending a line break
			
			if( childNode instanceof SuiteNode ) {
				this.appendSuite( childNode, buffer );
			} else if( childNode instanceof TestCaseNode ) {
				this.appendTestCase( childNode, buffer );
			}
			
			this.appendOutput( '', buffer );  // will result in appending a line break
		}, this );
		
		this.indentLevel--;
		this.appendOutput( '} );', buffer );
	},
	
	
	/**
	 * Appends a {@link node.TestCase TestCase} node to the output.
	 * 
	 * @protected
	 * @param {node.TestCase} testCaseNode
	 * @param {String[]} buffer The output buffer to append to.
	 */
	appendTestCase : function( testCaseNode, buffer ) {
		this.appendOutput( 'describe( "' + testCaseNode.getName() + '", function() {', buffer );
		this.indentLevel++;
		
		var isDiTestCase = ( testCaseNode instanceof DiTestCaseNode ),
		    should = testCaseNode.getShould(),
		    setUp = testCaseNode.getSetUp(),
		    tearDown = testCaseNode.getTearDown(),
		    tests = testCaseNode.getTests(),
		    helperMethods = testCaseNode.getHelperMethods();
		
		if( isDiTestCase ) {
			// For "direct instantiation" test cases, we always need to append a beforeEach() and afterEach()
			// block for Jasmine to execute the setUp() and tearDown() methods that might be inherited by the
			// TestCase subclass.
			this.appendSetUp( setUp || new SetUpNode( "" ), testCaseNode, buffer );
			this.appendOutput( '', buffer );  // will result in appending a line break
			
			this.appendTearDown( tearDown || new TearDownNode( "" ), testCaseNode, buffer );
			this.appendOutput( '', buffer );  // will result in appending a line break
		} else {
			if( setUp ) {
				this.appendSetUp( setUp, testCaseNode, buffer );
				this.appendOutput( '', buffer );  // will result in appending a line break
			}
			if( tearDown ) {
				this.appendTearDown( tearDown, testCaseNode, buffer );
				this.appendOutput( '', buffer );  // will result in appending a line break
			}
		}
		
		// Append Helper Methods
		helperMethods.forEach( function( helperMethod ) {
			this.appendOutput( '', buffer );  // will result in appending a line break
			this.appendHelperMethod( helperMethod, buffer );
			this.appendOutput( '', buffer );  // will result in appending a line break
		}, this );
		
		// Append Tests
		tests.forEach( function( test ) {
			this.appendOutput( '', buffer );  // will result in appending a line break
			this.appendTest( test, should, helperMethods, buffer );
			this.appendOutput( '', buffer );  // will result in appending a line break
		}, this );
		
		this.indentLevel--;
		this.appendOutput( '} );', buffer );
	},
	
	
	/**
	 * Appends a {@link node.SetUp SetUp} node, converting the `this` references to `thisSuite` in the setUp()
	 * body
	 * 
	 * @protected
	 * @param {node.SetUp} setUpNode
	 * @param {node.TestCase} testCaseNode The TestCase node for this SetUp node. The logic is handled
	 *   a little differently when this is a {@link node.DiTestCase DiTestCase} ("direct instantiation" test case)
	 *   node, in which the test case constructor is executed, and its `setUp()` method is run to initialize the
	 *   fixture.
	 * @param {String[]} buffer The output buffer to append to.
	 */
	appendSetUp : function( setUpNode, testCaseNode, buffer ) {
		this.appendOutput( 'var thisSuite;', buffer );
		this.appendOutput( '', buffer );
		
		this.appendOutput( 'beforeEach( function() {', buffer );
		this.indentLevel++;
		
		var setUpBody = setUpNode.getBody();
		
		if( testCaseNode instanceof DiTestCaseNode ) {
			// Remove any superclass call from the setUp method body
			setUpBody = this.removeSuperclassCall( setUpBody );    // must be done before transforming `this` references
			setUpBody = this.transformThisReferences( setUpBody );
			
			this.appendOutput( 'thisSuite = new ' + testCaseNode.getCtorFnName() + '();', buffer );
			this.appendOutput( 'thisSuite.setUp();', buffer );
			if( setUpBody.trim() !== "" ) {
				this.appendOutput( '', buffer );   // will result in appending a line break
				this.appendOutput( setUpBody, buffer );
			}
		} else {
			setUpBody = this.transformThisReferences( setUpBody );
			
			this.appendOutput( 'thisSuite = {};', buffer );
			this.appendOutput( '', buffer );   // will result in appending a line break
			this.appendOutput( setUpBody, buffer );
		}
		
		this.indentLevel--;
		this.appendOutput( '} );', buffer );
	},
	
	
	/**
	 * Appends a {@link node.TearDown TearDown} node, converting the `this` references to `thisSuite` in the tearDown()
	 * body.
	 * 
	 * @protected
	 * @param {node.TearDown} tearDownNode
	 * @param {node.TestCase} testCaseNode The TestCase node for this TearDown node. The logic is handled
	 *   a little differently when this is a {@link node.DiTestCase DiTestCase} ("direct instantiation" test case)
	 *   node, in which the test case constructor's object has its `tearDown()` method executed to tear down the fixture.
	 * @param {String[]} buffer The output buffer to append to.
	 */
	appendTearDown : function( tearDownNode, testCaseNode, buffer ) {
		this.appendOutput( 'afterEach( function() {', buffer );
		this.indentLevel++;
		
		var tearDownBody = tearDownNode.getBody();
		
		if( testCaseNode instanceof DiTestCaseNode ) {
			// Remove any superclass call from the setUp method body
			tearDownBody = this.removeSuperclassCall( tearDownBody );    // must be done before transforming `this` references
			tearDownBody = this.transformThisReferences( tearDownBody );
			
			if( tearDownBody.trim() !== "" ) {
				this.appendOutput( tearDownBody, buffer );
				this.appendOutput( '', buffer );   // will result in appending a line break
			}
			this.appendOutput( 'thisSuite.tearDown();', buffer );
		} else {
			tearDownBody = this.transformThisReferences( tearDownBody );
			this.appendOutput( tearDownBody, buffer );
		}
		
		this.indentLevel--;
		this.appendOutput( '} );', buffer );
	},
	
	
	/**
	 * Appends a {@link node.HelperMethod HelperMethod} node. Performs the following:
	 * 
	 * - Converts the `this` references to `thisSuite`.
	 * - Removes the try/catch blocks around JsMockito verifications, if there are any.
	 * - Replaces the YUI Test assertions with Jasmine assertions, if there are any.
	 * 
	 * @protected
	 * @param {node.HelperMethod} helperMethodNode
	 * @param {String[]} buffer The output buffer to append to.
	 */
	appendHelperMethod : function( helperMethodNode, buffer ) {
		var methodName = helperMethodNode.getName(),
		    argsList = helperMethodNode.getArgsList();
				
		this.appendOutput( 'function ' + methodName + '(' + argsList + ') {', buffer );
		this.indentLevel++;
		
		// Run Transformations on the code
		var methodBody = helperMethodNode.getBody();
		methodBody = this.transformThisReferences( methodBody );
		methodBody = this.removeTryCatchAroundJsMockito( methodBody );
		methodBody = this.convertAssertions( methodBody );
		
		this.appendOutput( methodBody, buffer );
		
		this.indentLevel--;
		this.appendOutput( '}', buffer );
	},
	
	
	/**
	 * Appends a {@link node.Test Test} node, using the context of a {@link node.Should Should} node.
	 * Performs the following:
	 * 
	 * - Converts the `this` references to `thisSuite`.
	 * - Removes the try/catch blocks around JsMockito verifications, if there are any.
	 * - Replaces the YUI Test assertions with Jasmine assertions, if there are any.
	 * 
	 * @protected
	 * @param {node.Test} testNode
	 * @param {node.Should} shouldNode
	 * @param {node.HelperMethod[]} helperMethods
	 * @param {String[]} buffer The output buffer to append to.
	 */
	appendTest : function( testNode, shouldNode, helperMethods, buffer ) {
		var testName = testNode.getName(),
		    ignoredTests = ( shouldNode ) ? shouldNode.getIgnoredTests() : {},
		    shouldErrorTests = ( shouldNode ) ? shouldNode.getErrorTests() : {},
		    itStr = ( ignoredTests[ testName ] ) ? 'xit' : 'it';
		
		this.appendOutput( itStr + '( "' + testNode.getName() + '", function() {', buffer );
		this.indentLevel++;
		
		// Run Transformations on the code
		var testBody = testNode.getBody();
		testBody = this.transformHelperMethodCalls( testBody, helperMethods );
		testBody = this.transformThisReferences( testBody );
		testBody = this.removeTryCatchAroundJsMockito( testBody );
		testBody = this.convertAssertions( testBody );
		
		// Rewrite to Jasmine
		if( shouldErrorTests[ testName ] ) {
			// If the test was a "should error" test in Ext.Test, wrap it in
			// an `expect( function(){ [testBody] } ).toThrow( "..." );`
			this.appendOutput( 'expect( function() {', buffer );
			this.indentLevel++;
			
			this.appendOutput( testBody, buffer );
			
			this.indentLevel--;
			this.appendOutput( '} ).toThrow( "' + shouldErrorTests[ testName ] + '" );', buffer );
			
		} else {
			this.appendOutput( testBody, buffer );
		}
		
		this.indentLevel--;
		this.appendOutput( '} );', buffer );
	},
	
	
	// ----------------------------------
	
	
	/**
	 * Removes the superclass call in a setUp() or tearDown() method. This is only used for "direct instantiation"
	 * TestCases. The superclass call looks something like this:
	 * 
	 *     app.controllers.quark.edit.AbstractSlideshowTest.prototype.setUp.apply( this, arguments );
	 * 
	 * @param {String} code The code of the setUp() or tearDown() method.
	 * @return {String} The code with the superclass call line replaced.
	 */
	removeSuperclassCall : function( code ) {
		// Remove the line of the superclass call
		code = code.replace( /^[ \t]*.*?\.prototype.(setUp|tearDown).apply\(\s*this\s*,\s*arguments\s*\);[ \t]*\r?\n?/m, '' );
		
		// Remove any newly prefixed empty line, in case the superclass call was on the first line,
		// and there was an empty line after it
		code = code.replace( /^([ \t]*\r?\n)+/, '' );
		
		// Remove any newly trailing line break, in case the superclass call was on the last line
		code = code.replace( /([ \t]*\r?\n)+$/, '' );
		
		return code;
	},
	
	
	/**
	 * Converts helper method calls in the `input` string, which are usually of the form `this.myHelper()`,
	 * to a non-method function call such as `myHelper()`. This is because helper methods are output as
	 * regular function declarations, rather than as a part of a test case as they were in Ext.Test.
	 * 
	 * This method should be called before {@link #transformThisReferences} is, as {@link #transformThisReferences}
	 * would make all `this` references become `thisSuite`, thus causing this method to have no effect, as it
	 * looks for `this.methodName`.
	 */
	transformHelperMethodCalls : function( input, helperMethods ) {
		for( var i = 0, len = helperMethods.length; i < len; i++ ) {
			var methodName = helperMethods[ i ].getName(),
			    re = new RegExp( '(this|me|self)\\.' + methodName + '(?![A-Za-z0-9_$])', 'g' );  // `this.methodName` *not* followed by an identifier character (i.e. `this.methodName` alone)
			
			input = input.replace( re, methodName );
		}
		return input;  // the transformed input
	},
	
	
	/**
	 * Transform the `this` reference in the block of code to use `thisSuite` instead, which will be used when the 
	 * Jasmine transformation is output by the {@link JasmineWriter}.
	 * 
	 * @param {String} input The input code string.
	 * @return {String} The input, with `this` references converted to `thisSuite`.
	 */
	transformThisReferences : function( input ) {
		return input.replace( /\bthis\.(?=[A-Za-z_\$])/g, 'thisSuite.' );
	},
	
	
	/**
	 * Removes the try/catch blocks around JsMockito verifications.
	 * 
	 * In the Ext.Test harness, we would write code like this:
	 * 
	 *     try {
	 *         JsMockito.verify( someMock ).methodCall();
	 *     } catch( e ) {
	 *         Y.Assert.fail( typeof e === 'string' ? e : e.message );
	 *     }
	 * 
	 * Instead of this, we want simply:
	 *     
	 *     JsMockito.verify( someMock ).methodCall();
	 * 
	 * @protected
	 * @param {String} input
	 * @return {String} The new output.
	 */
	removeTryCatchAroundJsMockito : function( input ) {
		var tryRe = /^[ \t]*try\s*\{/gm,
		    tryMatch;
		
		while( tryMatch = tryRe.exec( input ) ) {
			var tryIdx = tryMatch.index,
			    tryOpenBraceIdx = tryIdx + tryMatch[ 0 ].indexOf( '{' ),
			    tryCloseBraceIdx = Parser.findMatchingClosingBrace( input, tryOpenBraceIdx ),
			    tryBlockCode = input.substring( tryOpenBraceIdx + 1, tryCloseBraceIdx );  // up to but not including the `try` closing brace
			
			if( tryBlockCode.indexOf( 'JsMockito' ) !== -1 ) {  // JsMockito exists in the try block
				// Remove 1 level of indent for the code in the try block
				tryBlockCode = tryBlockCode.replace( /^(\t| {4})/gm, '' );  // remove one instance of a tab, or 4 spaces
				
				// Strip off any prefixed or trailing carriage returns or newlines from the try block code
				tryBlockCode = tryBlockCode.replace( /^[\n\r]*|[\n\r]*$/g, '' );
				
				
				// Find the end of the catch block, in order to remove the catch
				var catchRe = /catch\(.*?\)\s*\{/g;   // 'g' flag needed to set lastIndex property
				catchRe.lastIndex = tryCloseBraceIdx + 1;
				catchRe.exec( input );  // execute to find the new lastIndex
				
				var catchBlockOpenBrace = catchRe.lastIndex - 1,  // use the new lastIndex value to determine where the `catch` open brace is
				    catchBlockCloseBrace = Parser.findMatchingClosingBrace( input, catchBlockOpenBrace );
				
				// Now reconstruct the string with everything before the `try` block, the inner contents of the `try` block,
				// and everything *after* the `catch` block (leaving the `catch` block out).
				input = input.substring( 0, tryIdx ) + tryBlockCode + input.substring( catchBlockCloseBrace + 1 );
			}
			
			// reset the lastIndex to the index where we found the current try block, but 3 chars after it (to go past 
			// the word "try"). By removing code in the case that JsMockito was found within the try block, we don't 
			// want to accidentally skip over any other try/catch blocks that are close by
			tryRe.lastIndex = tryIdx + 3;
		}
		
		return input;  // converted input
	},
	
	
	/**
	 * Converts YUI assertions to Jasmine. Properly parses out complex expressions provided to the assertion 
	 * calls, as regex's alone are incapable of this.
	 * 
	 * @protected
	 * @param {String} input
	 * @return {String} The new output.
	 */
	convertAssertions : function( input ) {
		var me = this,  // for closure
		    assertRe = /Y\.((?:\w+)?Assert)\.(\w+)\s*\(\s*([\s\S]*?)\s*\);/g;
		
		input = input.replace( assertRe, function( match, assertPkg, assertFn, argsStr ) {
			var args = Parser.parseArgsStr( argsStr ),
			    ret,
			    errMsg;
			
			switch( assertPkg ) {
				case 'Assert' :
					switch( assertFn ) {							
						case 'isUndefined' :
							ret = "expect( _.isUndefined( " + args[ 0 ] + " ) ).toBe( true );";
							errMsg = args[ 1 ];
							break;
						
						case 'isNull' :
							ret = "expect( " + args[ 0 ] + " ).toBe( null );";
							errMsg = args[ 1 ];
							break;
							
						case 'isNotNull' :
							ret = "expect( " + args[ 0 ] + " ).not.toBe( null );";
							errMsg = args[ 1 ];
							break;
							
						case 'isTrue' : case 'isFalse' :
							ret = "expect( " + args[ 0 ] + " ).toBe( " + ( assertFn === 'isTrue' ? 'true' : 'false' ) + " );";
							errMsg = args[ 1 ];
							break;
							
						case 'isString' :
							ret = "expect( _.isString( " + args[ 0 ] + " ) ).toBe( true );";
							errMsg = args[ 1 ];
							break;
							
						case 'isObject' :
							ret = "expect( _.isObject( " + args[ 0 ] + " ) ).toBe( true );";
							errMsg = args[ 1 ];
							break;
							
						case 'isArray' :
							ret = "expect( _.isArray( " + args[ 0 ] + " ) ).toBe( true );";
							errMsg = args[ 1 ];
							break;
							
						case 'isInstanceOf' :
							ret = "expect( " + args[ 1 ] + " instanceof " + args[ 0 ] + " ).toBe( true );";
							errMsg = args[ 2 ];
							break;
							
						case 'isNaN' :
							ret = "expect( isNaN( " + args[ 0 ] + " ) ).toBe( true );";
							errMsg = args[ 1 ];
							break;
							
						case 'areSame' :
							ret = "expect( " + args[ 1 ] + " ).toBe( " + args[ 0 ] + " );";
							errMsg = args[ 2 ];
							break;
							
						case 'areNotSame' :
							ret = "expect( " + args[ 1 ] + " ).not.toBe( " + args[ 0 ] + " );";
							errMsg = args[ 2 ];
							break;
						
						case 'areEqual' :
							ret = "expect( " + args[ 1 ] + " ).toEqual( " + args[ 0 ] + " );";
							errMsg = args[ 2 ];
							break;
						
						case 'areNotEqual' :
							ret = "expect( " + args[ 1 ] + " ).not.toEqual( " + args[ 0 ] + " );";
							errMsg = args[ 2 ];
							break;
							
						case 'fail' :
							ret = "expect( true ).toBe( false );";   // Seems to be no Jasmine fail() function
							errMsg = args[ 0 ];
							break;
							
							
						default :
							throw new Error( "Unknown function in YUI 'Assert' package: '" + assertFn + "'. Need to add a handler for it." ); 
					}
					break;
					
					
				case 'ArrayAssert' :
					switch( assertFn ) {
						case 'contains' :
							ret = "expect( " + args[ 1 ] + " ).toContain( " + args[ 0 ] + " );";
							errMsg = args[ 2 ];
							break;
							
						case 'doesNotContain' :
							ret = "expect( " + args[ 1 ] + " ).not.toContain( " + args[ 0 ] + " );";
							errMsg = args[ 2 ];
							break;
						
						case 'containsItems' :
							ret = "expect( _.intersection( " + args[ 0 ] + ", " + args[ 1 ] + " ).length ).toBe( " + args[ 0 ] + ".length );";
							errMsg = args[ 2 ];
							break;
							
						case 'itemsAreSame' :
							ret = "expect( " + args[ 1 ] + " ).toEqual( " + args[ 0 ] + " );";
							errMsg = args[ 2 ];
							break;
							
						case 'isEmpty' :
							ret = "expect( " + args[ 0 ] + " ).toEqual( [] );";
							errMsg = args[ 1 ];
							break;
							
						default :
							throw new Error( "Unknown function in YUI 'ArrayAssert' package: '" + assertFn + "'. Need to add a handler for it." );
					}
					break;
					
					
				case 'ObjectAssert' :
					switch( assertFn ) {
						case 'hasKey' :
							ret = "expect( " + args[ 1 ] + ".hasOwnProperty( " + args[ 0 ] + " ) ).toBe( true );";
							errMsg = args[ 2 ];
							break;
						
						case 'ownsKeys' : case 'hasKeys' :
							// Reuse the parseArgsStr method to determine the array elements. Send it the inner contents of the array.
							var arrayElements = Parser.parseArgsStr( args[ 0 ].substring( 1, args[ 0 ].length - 1 ) );
							ret = "";
							arrayElements.forEach( function( el ) {
								ret += "expect( " + args[ 1 ] + ".hasOwnProperty( " + el + " ) ).toBe( true );";
							} );
							errMsg = args[ 2 ];
							break;
							
						default :
							throw new Error( "Unknown function in YUI 'ObjectAssert' package: '" + assertFn + "'. Need to add a handler for it." );
					}
					break;
					
				default :
					throw new Error( "Unknown YUI assertion package: '" + assertPkg + "'. Need to add a handler for it." ); 
			}
			
			// Append the YUI error message argument as a comment. Jasmine matchers do not take messages.
			if( errMsg )
				ret += "  // orig YUI Test err msg: " + errMsg;
			
			return ret;
		} );
		
		return input;  // converted input
	}
	
} );

module.exports = JasmineWriter;