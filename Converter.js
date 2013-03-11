/*global module */
/*jshint boss:true, loopfunc:true */
var Converter = function() {
	
};

Converter.prototype = {
	constructor : Converter,  // fix constructor property
	
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
		str = this.convertOuterSuite( str );
		str = this.convertSuites( str );
		str = this.convertSetupAndTeardown( str );
		str = this.convertTests( str );
		str = this.convertAssertions( str );
		
		return str;
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
			
			// Add the Jasmine 'describe', 'beforeEach', 'afterEach', and 'it' globals
			globalsArr = globalsArr.concat( [ 'describe', 'beforeEach', 'afterEach', 'it' ] );
			
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
			return "/*global describe, beforeEach, afterEach, it */\n" + input;
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
			inbetweenItemsArrayStr = inbetweenItemsArrayStr.replace( /^([ \t]+)/gm, function( match ) {
				return match.replace( /^(\t| {4})/m, '' );  // remove one instance of a tab, or 4 spaces
			} );
			
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
			var openingBraceIdx = suiteMatch.index + suiteMatch[ 0 ].indexOf( '{' ),
			    closingBraceIdx = this.findMatchingClosingBrace( input, openingBraceIdx );
			
			var closingBraceRe = /\}\s*?,?/g;  // need 'g' flag to be able to set lastIndex
			closingBraceRe.lastIndex = closingBraceIdx;  // start at the closing brace we found
			
			var closingBrace = closingBraceRe.exec( input )[ 0 ],
			    closingBraceLen = closingBrace.length;
			input = input.substring( 0, closingBraceIdx ) + '} );' + input.substring( closingBraceIdx + closingBraceLen );
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
	convertSetupAndTeardown : function( input ) {
		console.log( "TODO: Implement convertSetupAndTeardown" );
		return input;
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
		    testMatch;
		
		// First, loop through every match, finding and replacing the closing brace of either '}' or '},'
		// with '} );' (which is the proper close for an `it()` block)
		while( testMatch = testRe.exec( input ) ) { 
			var openingBraceIdx = testMatch.index + testMatch[ 0 ].indexOf( '{' ),
			    closingBraceIdx = this.findMatchingClosingBrace( input, openingBraceIdx );
			
			var closingBraceRe = /\}\s*?,?/g;  // need 'g' flag to be able to set lastIndex
			closingBraceRe.lastIndex = closingBraceIdx;  // start at the closing brace we found
			
			var closingBrace = closingBraceRe.exec( input )[ 0 ],
			    closingBraceLen = closingBrace.length;
			input = input.substring( 0, closingBraceIdx ) + '} );' + input.substring( closingBraceIdx + closingBraceLen );
		}
		
		
		// Now replace all suites found with describe() blocks
		input = input.replace( testRe, '$1it( "$2", function() {' );
		
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
		
		
		//console.log( '-----------------------------------' );
		//console.log( input.match( assertRe ) );
		input = input.replace( assertRe, function( match, assertPkg, assertFn, argsStr ) {
			//console.log( "match: " + match );
			//console.log( "assertPkg: " + assertPkg );
			//console.log( "assertFn: " + assertFn );
			//console.log( "argsStr: " + argsStr );
			
			var args = me.parseArgsStr( argsStr ),
			    ret,
			    errMsg;
			
			switch( assertPkg ) {
				case 'Assert' :
					switch( assertFn ) {
						case 'isTrue' : case 'isFalse' :
							ret = "expect( " + args[ 0 ] + " ).toBe( " + ( assertFn === 'isTrue' ? 'true' : 'false' ) + " );";
							errMsg = args[ 1 ];
							break;
							
						case 'areSame' :
							ret = "expect( " + args[ 1 ] + " ).toBe( " + args[ 0 ] + " );";
							errMsg = args[ 2 ];
							break;
						
						case 'areEqual' :
							ret = "expect( " + args[ 1 ] + " ).toEqual( " + args[ 0 ] + " );";
							errMsg = args[ 2 ];
							break;
							
						case 'isInstanceOf' :
							ret = "expect( " + args[ 1 ] + " instanceof " + args[ 0 ] + " ).toBe( true );";
							errMsg = args[ 2 ];
							break;
							
						case 'isObject' :
							ret = "expect( _.isObject( " + args[ 0 ] + " ) ).toBe( true );";
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
							
							
						default :
							throw new Error( "Unknown function in YUI 'Assert' package: '" + assertFn + "'. Need to add a handler for it." ); 
					}
					break;
					
				//case 'ArrayAssert' :
					
				default :
					throw new Error( "Unknown YUI assertion package: '" + assertPkg + "'. Need to add a handler for it." ); 
			}
			
			// Append the YUI error message argument as a comment. Jasmine matchers do not take messages.
			if( errMsg )
				ret += "  // orig YUI err msg: " + errMsg;
			
			return ret;
		} );
		
		return input;  // converted input
	},
	
	
	// -----------------------------------
	
	
	/**
	 * Utility method used to find the matching closing brace of an opening brace in a string of JavaScript code.
	 * Matches `{}`, `[]`, and `()`.
	 * 
	 * @protected
	 * @param {String} input The input string.
	 * @param {Number} idx The index of the brace character in the input string. The brace character will be read,
	 *   and then the input string will be walked until the matching end brace is found. Handles '{' and '[' being
	 *   at the index position provided to this argument.
	 * @return {Number} The index of the matching end brace in the `input` string.
	 * @throws {Error} If the end of the string is reached without finding the matching closing brace.
	 */
	findMatchingClosingBrace : function( input, idx ) {
		var openBraceChar = input.charAt( idx ),
		    closeBraceChar;
		
		switch( openBraceChar ) {
			case '{' : closeBraceChar = '}'; break;
			case '[' : closeBraceChar = ']'; break;
			case '(' : closeBraceChar = ')'; break;
			default : 
				throw new Error( "Character at idx " + idx + " of input string was not an open brace. Found: '" + openBraceChar + "' instead" );
		}
		
		var openBraceCount = 1,    // we're starting at the next char after the open brace, so we know we have one open brace
		    currentCharIdx = idx + 1,  // start at the character after the open brace provided to the method
		    inputStrLen = input.length;
		
		while( openBraceCount > 0 && currentCharIdx < inputStrLen ) {
			var currentChar = input.charAt( currentCharIdx );
			switch( currentChar ) {
				case openBraceChar : 
					openBraceCount++; 
					break;
				case closeBraceChar : 
					openBraceCount--; 
					break;
				case "'" : case '"' : case '/' :   // quote or RegExp literal. Would be a problem if someone used the divide symbol in their code, but that's pretty rare for unit tests. Need to implement a bit more complex parsing if this is the case though.
					currentCharIdx = this.findMatchingClosingLiteral( input, currentCharIdx );  // skip over the string or RegExp literal
			}
			
			// Break out of the loop if we've found the closing brace
			if( openBraceCount === 0 ) {
				break;
			}
			currentCharIdx++;
		}
		
		// If at this point, we didn't find the matching end brace but the loop has terminated because we reached
		// the end of the string, then throw an error
		if( openBraceCount > 0 ) {
			throw new Error( "A match for the opening brace '" + openBraceChar + "' at index " + idx + " was not found. End of input reached." );
		} else {
			return currentCharIdx;
		}
	},
	
	
	
	/**
	 * Similar to {@link #findMatchingClosingBrace}, this method finds the matching closing token which
	 * ends a string or RegExp literal.
	 * 
	 * @protected
	 * @param {String} input The input string.
	 * @param {Number} idx The index of the string or RegExp literal character in the input string. The character will be read,
	 *   and then the input string will be walked until the matching end character is found. Handles `'`, `"`, and `/` being
	 *   at the index position provided to this argument.
	 * @return {Number} The index of the matching end literal character in the `input` string.
	 * @throws {Error} If the end of the string is reached without finding the matching closing brace.
	 */
	findMatchingClosingLiteral : function( input, idx ) {
		var literalChar = input.charAt( idx );
		
		if( typeof idx !== 'number' ) {
			throw new Error( "'idx' arg required" );
		}
		if( literalChar !== "'" && literalChar !== '"' && literalChar !== '/' ) {
			throw new Error( "Character at idx " + idx + " of input string was not an opening string or RegExp literal character. Found: `" + literalChar + "` instead" );
		}
		
		var currentCharIdx = idx + 1,  // start at the character after the open literal char provided to the method
		    inputStrLen = input.length;
		
		while( currentCharIdx < inputStrLen ) {
			var currentChar = input.charAt( currentCharIdx );
			if( currentChar === literalChar && input.charAt( currentCharIdx - 1 ) !== '\\' ) {
				// If the current character is the matching literal end character, and the char before it
				// is not the escape char....
				return currentCharIdx;
			}
			
			currentCharIdx++;
		}
		
		// If at this point, we didn't find the matching end literal char but the loop has terminated because we reached
		// the end of the string, then throw an error
		throw new Error( "A match for the opening literal char `" + literalChar + "` at index " + idx + " was not found. End of input reached." );
	},
	
	
	
	/**
	 * Utility method used to parse out the arguments expressions provided to an assertion call. Regex's alone
	 * are not capable of doing this when it comes to nested function calls in the expressions, as well as for
	 * object / array literals.
	 * 
	 * @protected
	 * @param {String} argsStr The string of input that lies between parenthesis in a function call. 
	 *   Ex: "arg1, arg2, fn( 3, 4 ), [ arg4, arg5 ], { a: arg6, b: arg7 }, arg8"
	 * @return {String[]} Each of the function expressions in an array, one element for each argument.
	 */
	parseArgsStr : function( argsStr ) {
		// Simple parser to parse what is between the "root level" commas
		var startIdx = 0,
		    currentIdx = 0,
		    argsStrLen = argsStr.length,
		    args = [],
		    arg;
		
		while( currentIdx < argsStrLen ) {
			var currentChar = argsStr.charAt( currentIdx );
			
			// Skip over braces and string/regexp literals
			if( currentChar === '{' || currentChar === '[' || currentChar === '(' ) {
				currentIdx = this.findMatchingClosingBrace( argsStr, currentIdx ) + 1;  // advance the currentIdx one char past the matching closing brace
				currentChar = argsStr.charAt( currentIdx );
			} else if( currentChar === "'" || currentChar === '"' || currentChar === '/' ) {
				currentIdx = this.findMatchingClosingLiteral( argsStr, currentIdx ) + 1;  // advance the currentIdx one char past the matching end literal char
				currentChar = argsStr.charAt( currentIdx );
			}
			
			if( currentChar === ',' ) {   // a comma
				args.push( argsStr.substring( startIdx, currentIdx ) );
				
				currentIdx++;           // advance past the comma
				startIdx = currentIdx;  // mark the starting position of the next argument
			
			} else if( currentIdx >= argsStrLen - 1 ) {  // last char in the string
				args.push( argsStr.substring( startIdx, argsStrLen ) );				
				break;
				
			} else {
				currentIdx++;
			}
		}
		
		return args.map( function( el ) { return el.trim(); } );  // trim any spaces off each element before returning
	}

};

module.exports = Converter;