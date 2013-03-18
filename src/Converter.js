/*global require, module */
/*jshint boss:true */
var Class = require( './Class' ),
    Parser = require( './Parser' );

var Converter = Class.extend( Object, {
	
	/**
	 * Performs the full conversion, applying all transformations.
	 * 
	 * @param {String} input The input string to convert. Usually the contents of the file to convert.
	 * @return {String} The converted output.
	 */
	convert : function( input ) {
		var str = input;
		
		// Apply all transformations
		str = this.convertJsHintGlobals( str );
		str = this.removeItemsArrays( str );
		str = this.removeTryCatchAroundJsMockito( str );
		str = this.convertOuterSuite( str );
		str = this.convertSuites( str );
		str = this.convertSetUpAndTearDown( str );
		str = this.convertTests( str );
		str = this.convertAssertions( str );
		
		return str;
	},
	
	
	/**
	 * Parses the `input` into a tree of {@link node.Node Nodes}.
	 * 
	 * @param {String} input
	 * @return {node.Node} The root of the parsed tree.
	 */
	parse : function( input ) {
		return new Parser( input ).parse();
	},
	
	
	/**
	 * Adds JSHint globals for Jasmine, while removing those for Ext.Test and YUI. Modifies an existing
	 * globals definition, or adds a new one if missing.
	 * 
	 * @protected
	 * @param {String} input
	 * @return {String} The new output.
	 */
	convertJsHintGlobals : function( input ) {
		// Find a JSHint globals definition, if there is one
		var globalsRe = /\/\*global (.*?)\s*\*\//,
		    globalsDef = globalsRe.exec( input );
		
		if( globalsRe.test( input ) ) {
			// Existing globals
			var globals = globalsRe.exec( input )[ 1 ],  // comma delimited list of the globals themselves. ex: "window, jQuery, ..."
			    globalsArr = globals.split( /,\s*/ );
			
			// Remove 'Ext', 'Y', and 'tests' globals
			globalsArr = globalsArr.filter( function( e ) {
				return ( e !== 'Ext' && e !== 'Y' && e !== 'tests' );
			} );
			
			// Add the Jasmine 'describe', 'beforeEach', 'afterEach', 'it', and 'expect' globals
			globalsArr = globalsArr.concat( [ 'describe', 'beforeEach', 'afterEach', 'it', 'expect' ] );
			
			// Move JsMockito to the end of the list, if it is present. JsMockito feels like it should be after 
			// the test harness globals
			var jsMockitoIdx = globalsArr.indexOf( 'JsMockito' );
			if( jsMockitoIdx !== -1 ) {
				globalsArr.splice( jsMockitoIdx, 1 );  // remove from current location
				globalsArr.push( 'JsMockito' );        // add to end of array
			}
			
			// Replace the globals definition
			return input.replace( globalsRe, "/*global " + globalsArr.join( ', ' ) + " */" );
			
		} else {
			// No existing globals, simply prepend the globals
			return "/*global describe, beforeEach, afterEach, it, expect */\n" + input;
		}
	},
	
	
	/**
	 * Removes the 'items' arrays, and unindents their contents.
	 * 
	 * @protected
	 * @param {String} input
	 * @return {String} The new output.
	 */
	removeItemsArrays : function( input ) {
		var itemsRe = /^[ \t]*items\s*:\s*\[[\s\S]*?\n/gm,
		    itemsMatch;
		
		// We must loop through this test multiple times, as we need to handle multiple and
		// nested items arrays. First pass will get outer, next pass will get inner #1, then
		// inner #2, etc.
		while( itemsMatch = itemsRe.exec( input ) ) {
			var openingBraceIdx = itemsMatch.index + itemsMatch[ 0 ].indexOf( '[' ),
			    closingBraceIdx = this.findMatchingClosingBrace( input, openingBraceIdx );
			
			// Remove the level of indent that the 'items : [' line has, from all lines up to the matching ']' char
			var inbetweenItemsArrayStr = input.substring( itemsRe.lastIndex, closingBraceIdx );
			inbetweenItemsArrayStr = inbetweenItemsArrayStr.replace( /^(\t| {4})/gm, '' );  // remove one instance of a tab, or 4 spaces
			
			// Reconstruct the input string by taking everything before the 'items : [' line, and everything after its matching
			// end brace, and interpolate the in-between code with one level of indent removed
			var startStr = input.substring( 0, itemsMatch.index ),
			    endStr = input.substring( closingBraceIdx ).replace( /\],?[\r\n]*[ \t]*/, '' );  // remove the end brace, an optional comma, any newlines at the beginning of the new endStr, and any whitespace after it
						
			input = startStr + inbetweenItemsArrayStr + endStr;
			
			itemsRe.lastIndex = 0;  // reset the last index, so we simply start from the top again.
			                        // this will eventually handle all cases, without having to 
			                        // calculate offsets for characters removed and such
		}
		
		return input;  // converted input
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
			    tryCloseBraceIdx = this.findMatchingClosingBrace( input, tryOpenBraceIdx ),
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
				    catchBlockCloseBrace = this.findMatchingClosingBrace( input, catchBlockOpenBrace );
				
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
	 * Converts the special syntax of the outer Ext.Test suite, which attaches
	 * the suite to the `tests` variable. Turns the outer suite into a describe block.
	 * 
	 * @protected
	 * @param {String} input
	 * @return {String} The new output.
	 */
	convertOuterSuite : function( input ) {
		var outerSuiteRe = /^([ \t]*)tests\.(.*?)\.add\(\s*new\s*Ext\.test\.TestSuite\(\s*\{\s*name\s*:\s*['"](.*?)['"],/m,
		    endOfFileOuterSuiteCloseRe = /\}\s*\)\s*\);\s*$/m;
		
		input = input.replace( outerSuiteRe, '$1describe( "$2.$3", function() {' );
		input = input.replace( endOfFileOuterSuiteCloseRe, '} );' );
		
		return input;
	},
	
	
	/**
	 * Converts Ext.Test suites to Jasmine `describe()` blocks.
	 * 
	 * @protected
	 * @param {String} input
	 * @return {String} The new output.
	 */
	convertSuites : function( input ) {
		var suiteRe = /^([ \t]*)\{\s*(?:\/\*[\s\S]*?\*\/)?\s*name\s*:\s*['"](.*?)['"],/gm,
		    suiteMatch;
		
		// First, loop through every match, finding and replacing the closing brace of either '}' or '},'
		// with '} );' (which is the proper close for a `describe()` block)
		while( suiteMatch = suiteRe.exec( input ) ) { 
			var openingBraceIdx = suiteMatch.index + suiteMatch[ 0 ].indexOf( '{' );
			input = this.replaceMatchingClosingBrace( input, openingBraceIdx );
		}
		
		// Now replace all suites found with describe() blocks
		input = input.replace( suiteRe, '$1describe( "$2", function() {' );
		
		// Remove any `ttype` lines, which specified an inner suite. Ex: `ttype : 'suite',`
		input = input.replace( /^[ \t]*ttype\s*?:.*[\n\r]+/gm, '' );
		
		return input;  // converted input
	},
	
	
	/**
	 * Converts the `setUp()` and `tearDown()` blocks of Ext.Test to `beforeEach()` and `afterEach()` blocks for Jasmine.
	 * 
	 * @protected
	 * @param {String} input
	 * @return {String} The new output.
	 */
	convertSetUpAndTearDown : function( input ) {
		var setUpTearDownRe = /^([ \t]*)(setUp|tearDown)\s*:\s*function\(\)\s*\{/gm,
		    match,
		    openingBraceIdx,
		    closingBraceIdx;
		
		// First, loop through every setUp() and tearDown() match, finding and replacing the closing brace of either '}' or '},'
		// with '} );' (which is the proper close for `beforeEach()` and `afterEach()` blocks)
		while( match = setUpTearDownRe.exec( input ) ) {
			openingBraceIdx = match.index + match[ 0 ].indexOf( '{' );
			input = this.replaceMatchingClosingBrace( input, openingBraceIdx );
		}
		
		
		// Now process the code for the setUp() and tearDown() methods. We want to replace all occurrences of `this` to `thisSuite`.
		// Also, we want to add `var thisSuite = {};` above the method for 'this' scoped variables.
		while( match = setUpTearDownRe.exec( input ) ) {
			var matchIdx = match.index,
			    indentWhitespace = match[ 1 ];
			
			openingBraceIdx = matchIdx + match[ 0 ].indexOf( '{' );
			closingBraceIdx = this.findMatchingClosingBrace( input, openingBraceIdx );
			
			var codeInMethod = input.substring( openingBraceIdx + 1, closingBraceIdx );
			codeInMethod = codeInMethod.replace( /\bthis\.\b/g, 'thisSuite.' );
			
			// Build the new beforeEach() or afterEach() method, based on what the match was (either setUp() or tearDown())
			var newInput = input.substring( 0, matchIdx ) + indentWhitespace;
			if( match[ 0 ].indexOf( 'setUp' ) !== -1 ) {
				newInput += 'var thisSuite = {};\n\n' + indentWhitespace + 'beforeEach( function() {';
			} else {
				newInput += 'afterEach( function() {';
			}
			newInput += codeInMethod + input.substring( closingBraceIdx );
			input = newInput;
			
			// Reset the RegExp's lastIndex property, so that we start searching again at the same position as the last
			// match, minus the number of characters for the added `var thisSuite = {};\n\n`. We don't want code changes 
			// to affect the offset and possibly have the RegExp miss a match.
			setUpTearDownRe.lastIndex = Math.max( matchIdx - 11, 0 );
		}
		
		return input;  // converted input
	},
	
	
	/**
	 * Converts Ext.Test tests to Jasmine `it()` blocks.
	 * 
	 * @protected
	 * @param {String} input
	 * @return {String} The new output.
	 */
	convertTests : function( input ) {
		// There are two styles of tests to find here.
		// 1) "something should happen" : function() {
		// 2) test_somethingShouldHappen : function() {
		var testRe = /^([ \t]*)(?:"|test_?)(.*?)"?\s*:\s*function\(\)\s*\{/gm,
		    testMatch,
		    openingBraceIdx,
		    closingBraceIdx;
		
		// First, loop through every match, finding and replacing the closing brace of either '}' or '},'
		// with '} );' (which is the proper close for an `it()` block)
		while( testMatch = testRe.exec( input ) ) { 
			openingBraceIdx = testMatch.index + testMatch[ 0 ].indexOf( '{' );
			input = this.replaceMatchingClosingBrace( input, openingBraceIdx );
		}
		
		// Now process the code for the test methods. We want to replace all occurrences of `this` to `thisSuite`.
		while( testMatch = testRe.exec( input ) ) {
			var matchIdx = testMatch.index,
			    indentWhitespace = testMatch[ 1 ];
			
			openingBraceIdx = matchIdx + testMatch[ 0 ].lastIndexOf( '{' );
			closingBraceIdx = this.findMatchingClosingBrace( input, openingBraceIdx );
			
			var codeInMethod = input.substring( openingBraceIdx + 1, closingBraceIdx );
			codeInMethod = codeInMethod.replace( /\bthis\.\b/g, 'thisSuite.' );
			
			// Build the new it() method
			var newInput = [];
			newInput[ newInput.length ] = input.substring( 0, matchIdx ) + indentWhitespace;
			newInput[ newInput.length ] = 'it( "' + testMatch[ 2 ] + '", function() {';
			newInput[ newInput.length ] = codeInMethod + input.substring( closingBraceIdx );
			input = newInput.join( "" );
			
			// Reset the RegExp's lastIndex property, so that we start searching again at the same position as the last
			// match. We don't want code changes to affect the offset and possibly have the RegExp miss a match.
			testRe.lastIndex = matchIdx;
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
			var args = me.parseArgsStr( argsStr ),
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
							var arrayElements = me.parseArgsStr( args[ 0 ].substring( 1, args[ 0 ].length - 1 ) );
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
	},
	
	
	
	// -----------------------------------
	
	
	/**
	 * Utility method used to replace a matching closing curly brace that was used in the object literal form
	 * for Ext.Test of either `}` or `},`, to the end function + call brace `} );`
	 * 
	 * This method is used to replace `suites`, `tests`, `setUp()`, and `tearDown()` methods to be the correct end brace
	 * sequence for `describe()`, `it()`, `beforeEach()`, and `afterEach()` methods, respectively.
	 * 
	 * @protected
	 * @param {String} input The input string.
	 * @param {Number} openingBraceIdx The index of the opening brace to replace.
	 * @return {String} The converted input, with the end brace replaced to the correct sequence.
	 */
	replaceMatchingClosingBrace : function( input, openingBraceIdx ) {
		var closingBraceIdx = this.findMatchingClosingBrace( input, openingBraceIdx );
		
		var closingBraceRe = /\}\s*?,?/g;  // need 'g' flag to be able to set lastIndex
		closingBraceRe.lastIndex = closingBraceIdx;  // start at the closing brace we found
		
		var closingBrace = closingBraceRe.exec( input )[ 0 ],
		    closingBraceLen = closingBrace.length;
		input = input.substring( 0, closingBraceIdx ) + '} );' + input.substring( closingBraceIdx + closingBraceLen );
		
		return input;  // converted input
	}

} );

module.exports = Converter;