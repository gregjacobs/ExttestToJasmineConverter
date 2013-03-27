/*global require, module */
/*jshint boss:true */
var _ = require( 'lodash' ),
    Class = require( '../Class' ),
    Parser = require( '../Parser' ),  // its static methods are used as utilities
    NodeVisitor = require( './Visitor' );


/**
 * @class node.JasmineTransformVisitor
 * @extends node.NodeVisitor
 * 
 * Visits a {@link node.Node} structure, and transforming pieces of each Node to what is expected
 * in Jasmine. This includes:
 * 
 * 1. Converting the `this` reference in {@link node.SetUp SetUp} nodes to `thisSuite`.
 * 2. Converting the `this` reference in {@link node.TearDown TearDown} nodes to `thisSuite`.
 * 3. Converting the `this` reference in {@link node.Test Test} nodes to `thisSuite`.
 * 4. Removing the try/catch blocks around JsMockito verifications in {@link node.Test Test} nodes.
 * 5. Replacing YUI Test assertions with Jasmine assertions in {@link node.Test Test} nodes. * 
 */
var JasmineTransformVisitor = Class.extend( NodeVisitor, {
	
	/**
	 * @constructor
	 * @param {Object} cfg The configuration options for this class.
	 */
	constructor : function( cfg ) {
		_.assign( this, cfg );
	},
	
	
	// -----------------------------------
	
	
	/**
	 * Visits a {@link node.Suite Suite} node.
	 * 
	 * @param {node.Suite} suiteNode
	 */
	visitSuite : function( suiteNode ) {
		// No implementation - its children are visited separately
	},
	
	
	/**
	 * Visits a {@link node.TestCase TestCase} node. This method handles the inners
	 * of the TestCase explicitly, rather than letting the visitor be called for its
	 * pieces.
	 * 
	 * @param {node.TestCase} testCaseNode
	 */
	visitTestCase : function( testCaseNode ) {
		// No implementation - its tests are visited separately
	},
	
	
	/**
	 * Visits a {@link node.Should Should} node.
	 * 
	 * @param {node.Should} shouldNode
	 */
	visitShould : function() {
		// No implementation
	},
	
	
	/**
	 * Visits a {@link node.SetUp SetUp} node. Converts `this` references in the SetUp node's body
	 * to `thisSuite`, which will be used instead in the Jasmine setup.
	 * 
	 * @param {node.SetUp} setUpNode
	 */
	visitSetUp : function( setUpNode ) {
		var body = setUpNode.getBody();
		body = this.transformThisReferences( body );
		
		setUpNode.setBody( body );
	},
	
	
	/**
	 * Visits a {@link node.TearDown TearDown} node. Converts `this` references in the SetUp node's body
	 * to `thisSuite`, which will be used instead in the Jasmine setup.
	 * 
	 * @param {node.TearDown} tearDownNode
	 */
	visitTearDown : function( tearDownNode ) {
		var body = tearDownNode.getBody();
		body = this.transformThisReferences( body );
		
		tearDownNode.setBody( body );
	},
	
	
	/**
	 * Visits a {@link node.Test Test} node. Removes the try/catch blocks around JsMockito verifications,
	 * and replaces YUI Test assertions with Jasmine assertions.
	 * 
	 * @param {node.Test} testNode
	 */
	visitTest : function( testNode ) {
		var body = testNode.getBody();
		
		body = this.transformThisReferences( body );
		body = this.removeTryCatchAroundJsMockito( body );
		body = this.convertAssertions( body );
		
		testNode.setBody( body );
	},
	
	
	// --------------------------------------	
	
	
	
	/**
	 * Transform the `this` reference in the block of code to use `thisSuite` instead, which will be used when the 
	 * Jasmine transformation is output by the {@link JasmineWriter}.
	 * 
	 * @param {String} input The input code string.
	 * @return {String} The input, with `this` references converted to `thisSuite`.
	 */
	transformThisReferences : function( input ) {
		return input.replace( /\bthis\.\b/g, 'thisSuite.' );
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
							
						case 'areSame' :
							ret = "expect( " + args[ 1 ] + " ).toBe( " + args[ 0 ] + " );";
							errMsg = args[ 2 ];
							break;
						
						case 'areEqual' :
							ret = "expect( " + args[ 1 ] + " ).toEqual( " + args[ 0 ] + " );";
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

module.exports = JasmineTransformVisitor;