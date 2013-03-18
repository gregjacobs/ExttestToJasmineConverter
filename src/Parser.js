/*global require, module */
/*jshint boss:true */
var Class = require( './Class' ),
    SuiteNode    = require( './node/Suite' ),
    TestCaseNode = require( './node/TestCase' ),
    ShouldNode   = require( './node/Should' ),
    SetUpNode    = require( './node/SetUp' ),
    TearDownNode = require( './node/TearDown' ),
    TestNode     = require( './node/Test' );


/**
 * @class Parser
 * 
 * Parses the the provided `input` to into a tree of {@link node.Node Nodes} representing the construction
 * of Ext.Test unit tests. The nodes consist of {@link node.Suite Suites}, {@link node.TestCase TestCases},
 * and {@link node.Test Tests}.
 */
var Parser = Class.extend( Object, {
	
	statics : {
		
		/**
		 * Utility method used to find the matching closing brace of an opening brace in a string of JavaScript code.
		 * Matches `{}`, `[]`, and `()`.
		 * 
		 * @static
		 * @param {String} input The input string.
		 * @param {Number} idx The index of the brace character in the input string. The brace character will be read,
		 *   and then the input string will be walked until the matching end brace is found. Handles '{' and '[' being
		 *   at the index position provided to this argument.
		 * @return {Number} The index of the matching end brace in the `input` string.
		 * @throws {Error} If the end of the string is reached without finding the matching closing brace.
		 */
		findMatchingClosingBrace : function( input, idx ) {
			if( typeof idx !== 'number' ) {
				throw new Error( "'idx' arg required" );
			}
			
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
					
					case '/' :
						var nextChar = input.charAt( currentCharIdx + 1 );
						if( nextChar === '/' || nextChar === '*' ) {  // comment
							currentCharIdx = this.findMatchingEndComment( input, currentCharIdx );  // skip over the JS comment
						} else {
							// RegExp literal. Would be a problem if someone used the divide symbol in their code, but that's pretty rare 
							// for unit tests. Need to implement a bit more complex parsing if this is the case though.
							currentCharIdx = this.findMatchingClosingLiteral( input, currentCharIdx );  // skip over the RegExp
						}
						break;
						
					case "'" : case '"' :
						currentCharIdx = this.findMatchingClosingLiteral( input, currentCharIdx );  // skip over the string
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
		 * @static
		 * @param {String} input The input string.
		 * @param {Number} idx The index of the string or RegExp literal character in the input string. The character will be read,
		 *   and then the input string will be walked until the matching end character is found. Handles `'`, `"`, and `/` being
		 *   at the index position provided to this argument.
		 * @return {Number} The index of the matching end literal character in the `input` string.
		 * @throws {Error} If the end of the string is reached without finding the matching closing brace.
		 */
		findMatchingClosingLiteral : function( input, idx ) {
			if( typeof idx !== 'number' ) {
				throw new Error( "'idx' arg required" );
			}
			
			var literalChar = input.charAt( idx );
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
		 * Finds the end of a comment. The matching end character will either be a slash for a multi-line comment,
		 * or a linebreak (\n) for a single line comment.
		 * 
		 * @static
		 * @param {String} input The input string.
		 * @param {Number} idx The index of the beginning comment character in the input string. The character will be read,
		 *   and then the input string will be walked until the matching end character is found. Handles `//`, and `/*` being
		 *   at the index position provided to this argument.
		 * @return {Number} The index of the matching end literal character in the `input` string.
		 * @throws {Error} If the end of the string is reached without finding the matching closing brace.
		 */
		findMatchingEndComment : function( input, idx ) {
			if( typeof idx !== 'number' ) {
				throw new Error( "'idx' arg required" );
			}
			
			var beginCommentChar = input.charAt( idx ),
			    nextCommentChar = input.charAt( idx + 1 );
			if( beginCommentChar !== "/" )
				throw new Error( "Character at idx " + idx + " of input string was not an opening comment character. Found: `" + beginCommentChar + "` instead" );
			if( nextCommentChar !== '/' && nextCommentChar !== '*' )
				throw new Error( "Character at idx " + idx + " of input string was not an opening comment character. Found: `" + beginCommentChar + nextCommentChar + "` instead" );
			
			var inputStrLen = input.length,
			    currentCharIdx = idx + 1,
			    currentChar;
			
			if( nextCommentChar === '/' ) {
				// single line comment
				while( ( currentChar = input.charAt( currentCharIdx ) ) !== '\n' ) {
					currentCharIdx++;
				}
				return currentCharIdx;
				
			} else {
				// multi-line comment
				while( currentCharIdx < inputStrLen ) {
					currentChar = input.charAt( currentCharIdx );
					if( currentChar === '*' && input.charAt( currentCharIdx + 1 ) === '/' ) { 
						return currentCharIdx + 1;
					}
					currentCharIdx++;
				}
				throw new Error( "A match for the opening multi-line comment at index " + idx + " was not found. End of input reached." );
			}
		},
		
		/**
		 * Utility method used to parse out the arguments expressions provided to an assertion call. Regex's alone
		 * are not capable of doing this when it comes to nested function calls in the expressions, as well as for
		 * object / array literals.
		 * 
		 * @static
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
		
	},
	
	
	
	/**
	 * @protected
	 * @property {Number} currentPos
	 * 
	 * The current character position that is being read.
	 */
	currentPos : 0,
	
	/**
	 * @protected
	 * @property {RegExp} outerSuiteRe
	 * 
	 * The regular expression used to find the location of the outer suite.
	 * 
	 * Capturing groups:
	 * 
	 * 1. The whitespace of indent to the outer suite.
	 * 2. The package name for the suite. Example: 'unit.persistence'
	 * 3. The Suite name.
	 */
	outerSuiteRe : /^([ \t]*)tests\.(.*?)\.add\(\s*new\s*Ext\.test\.TestSuite\(\s*\{\s*name\s*:\s*['"](.*?)['"],/m,
	
	/**
	 * @protected
	 * @property {RegExp} suiteRe
	 * 
	 * The regular expression used to match inner suites. This is as opposed to the {@link #outerSuiteRe outer suite},
	 * where there should only be one.
	 * 
	 * Capturing groups:
	 * 
	 * 1. The Suite name.
	 */
	suiteRe : /\{\s*(?:\/\*[\s\S]*?\*\/)?\s*name\s*:\s*['"](.*?)['"],\s*?ttype.*?,/g,
	
	/**
	 * @protected
	 * @property {RegExp} testCaseRe
	 * 
	 * The regular expression used to match inner suites. This is as opposed to the {@link #outerSuiteRe outer suite},
	 * where there should only be one.
	 * 
	 * Capturing groups:
	 * 
	 * 1. The TestCase name.
	 */
	testCaseRe : /\{\s*(?:\/\*[\s\S]*?\*\/)?\s*name\s*:\s*['"](.*?)['"],(?!\s*?ttype)/g,
	
	
	/**
	 * @protected
	 * @property {RegExp} shouldRe
	 * 
	 * The regular expression used to match a "should" block, which holds instructions for tests to ignore, and
	 * tests which should throw errors.
	 */
	shouldRe : /_should\s*:\s*\{/g,
	
	/**
	 * @protected
	 * @property {RegExp} shouldErrorRe
	 * 
	 * The regular expression used to match an "error" block inside a "should" block, which holds instructions for tests
	 * which should throw errors.
	 */
	shouldErrorRe : /error\s*:\s*\{/g,
	
	/**
	 * @protected
	 * @property {RegExp} shouldIgnoreRe
	 * 
	 * The regular expression used to match an "ignore" block inside a "should" block, which holds instructions for tests
	 * which should be ignored.
	 */
	shouldIgnoreRe : /ignore\s*:\s*\{/g,
	
	/**
	 * @protected
	 * @property {RegExp} setUpRe
	 * 
	 * The regular expression used to match a setUp() method.
	 */
	setUpRe : /setUp\s*:\s*function\(\)\s*\{/g,
	
	/**
	 * @protected
	 * @property {RegExp} tearDownRe
	 * 
	 * The regular expression used to match a tearDown() method.
	 */
	tearDownRe : /tearDown\s*:\s*function\(\)\s*\{/g,
	
	/**
	 * @protected
	 * @property {RegExp} testRe
	 * 
	 * The regular expression used to match a test method. This is a method that starts with the word 'test',
	 * or has the word "should" in the method name.
	 * 
	 * Capturing groups:
	 * 
	 * 1. The Test name if the method name starts with 'test'.
	 * 1. The Test name if the method name has the word 'should' in it.
	 */
	testRe : /(?:test_?([A-Za-z_\$]*?)|['"](.*? should .*?)['"])\s*:\s*function\(\)\s*\{/g,
	
	/**
	 * @protected
	 * @property {RegExp} identifierRe
	 * 
	 * The regular expression used to match a JavaScript identifier.
	 */
	identifierRe : /[A-Za-z_\$][A-Za-z_\$0-9]*/g,
	
	
	
	/**
	 * @constructor
	 * @param {String} input The input string.
	 */
	constructor : function( input ) {
		if( !input ) throw new Error( "`input` required" );
		
		this.input = input;
	},
	
	
	// -----------------------------------
	
	// Main Parsing Methods
	
	
	/**
	 * Starts the parsing routine.
	 * 
	 * @return {node.Suite} The Suite node at the top level.
	 */
	parse : function() {		
		var suiteNode = this.parseOuterSuite();
		if( suiteNode === null ) {
			throw new Error( "No outer Ext.Test Suite found" );
		}
		return suiteNode;
	},
	
	
	/**
	 * Finds and parses the outer Suite , or returns `null` if the outer Suite could not be found.
	 * 
	 * @protected
	 * @return {node.Suite} The Suite node for the outer suite.
	 */
	parseOuterSuite : function() {
		var outerSuiteMatch = this.outerSuiteRe.exec( this.input ),
		    outerSuiteNode = null;
		
		if( outerSuiteMatch ) {
			var suiteName = outerSuiteMatch[ 2 ] + '.' + outerSuiteMatch[ 3 ];  // package name + class name
			this.currentPos = outerSuiteMatch.index + outerSuiteMatch[ 0 ].length;
			
			var children = [];
			
			
			outerSuiteNode = new SuiteNode( suiteName );
		}
		
		return outerSuiteNode;
	},
	
	
	/**
	 * Parses an inner Suite at the {@link #currentPos}, or returns `null` if a Suite was not matched.
	 * 
	 * @protected
	 * @return {node.Suite} The Suite node parsed at {@link #currentPos}, or `null` if a Suite was
	 *   not matched.
	 */
	parseSuite : function() {
		this.skipWhitespace();
		
		var suiteMatch = this.getMatch( this.suiteRe ),  // attempts to match the regex at the currentPos
		    suiteNode = null;
		
		if( suiteMatch !== null ) {  // if there's a Suite match at the current position
			var suiteName = suiteMatch[ 1 ];
			this.currentPos = suiteMatch.index + suiteMatch[ 0 ].length;
			
			var children = [];
			
			
			suiteNode = new SuiteNode( suiteName );
		}
		
		return suiteNode;
	},
	
	
	/**
	 * Parses a TestCase at the {@link #currentPos}, or returns `null` if a TestCase was not matched.
	 * 
	 * @protected
	 * @return {node.TestCase} The TestCase node parsed at {@link #currentPos}, or `null` if a TestCase was
	 *   not matched.
	 */
	parseTestCase : function() {
		this.skipWhitespace();
		
		var testCaseMatch = this.getMatch( this.testCaseRe ),  // attempts to match the regex at the currentPos
		    testCaseNode = null;
		
		if( testCaseMatch !== null ) {  // if there's a TestCase match at the current position
			// advance the current position
			this.currentPos = testCaseMatch.index + testCaseMatch[ 0 ].length;
			this.skipWhitespace();
			
			var name = testCaseMatch[ 1 ],
			    setUpNode = null,
			    tearDownNode = null,
			    shouldNode = null,
			    tests = [];
			
			
			testCaseNode = new TestCaseNode( name, setUpNode, tearDownNode, shouldNode, tests );
		}
		
		return testCaseNode;
	},
	
	
	/**
	 * Parses a "should" block at the {@link #currentPos}.
	 * 
	 * @return {node.Should} The "should" node, or `null` if a "should" block was not found at the {@link #currentPos}.
	 */
	parseShould : function() {
		this.skipWhitespace();
		
		var input = this.input,
		    shouldMatch = this.getMatch( this.shouldRe ),  // attempts to match the regex at the currentPos
		    shouldNode = null;
		
		if( shouldMatch !== null ) {  // if there's a "should" block match at the current position
			this.currentPos = shouldMatch.index + shouldMatch[ 0 ].length;  // advance current position to inside the _should object
			this.skipWhitespace();
			
			
			var errorMap,
			    ignoreMap,
			    errorMatch, 
			    ignoreMatch;
			
			while( ( errorMatch = this.getMatch( this.shouldErrorRe ) ) || ( ignoreMatch = this.getMatch( this.shouldIgnoreRe ) ) ) {
				this.currentPos += ( errorMatch || ignoreMatch )[ 0 ].length;
				this.skipWhitespace();
				
				var key, value, map = {};
				while( key = ( this.parseStringLiteral() || this.parseIdentifier() ) ) {
					this.skipWhitespace();
					if( this.peekChar() !== ':' )
						throw new Error( "Was looking for ':' and found '" + this.peekChar() + "' (at position " + this.currentPos + ")" );
					this.currentPos++;  // advance past the ':'
					this.skipWhitespace();
					
					value = this.parseStringLiteral() || this.parseBooleanLiteral() || this.parseIdentifier();
					map[ key ] = value;
					
					this.skipWhitespace();
					if( this.peekChar() === ',' ) {
						this.currentPos++;  // skip over the comma
					} else if( this.peekChar() === '}' ) {
						this.currentPos++;  // skip over the '}'
						break;
					} else {
						throw new Error( "Was looking for '}' and found '" + this.peekChar() + "' (at position " + this.currentPos + "). A line with: " + input.substring( this.currentPos - 15, this.currentPos + 15 ) );
					}
					this.skipWhitespace();
				}
				
				this.skipWhitespace();
				if( this.peekChar() === ',' )
					this.currentPos++;  // skip over the comma for the object literal holding an 'error' or 'ignore' object
				this.skipWhitespace();
				
				if( errorMatch )
					errorMap = map;
				else if( ignoreMatch )
					ignoreMap = map;
				
				errorMatch = ignoreMatch = null;  // reset them, so we know which one matched on the next loop iteration
			}
			
			if( input.charAt( this.currentPos ) !== '}' )
				throw new Error( "Expected '}' to end the _should block at char " + this.currentPos + ". Found '" + input.charAt( this.currentPos ) + "' instead." );
			
			this.currentPos++;  // advance past the }
			this.skipWhitespace();
			
			if( input.charAt( this.currentPos ) === ',' )
				this.currentPos++;  // advanced past the comma, if there is one
			
			shouldNode = new ShouldNode( ignoreMap, errorMap );
		}
		return shouldNode;
	},
	
	
	/**
	 * Parses a SetUp method at the {@link #currentPos}.
	 * 
	 * @return {node.SetUp} The SetUp node, or `null` if a setUp() method was not found at the {@link #currentPos}.
	 */
	parseSetUp : function() {
		this.skipWhitespace();
		
		var setUpMatch = this.getMatch( this.setUpRe ),  // attempts to match the regex at the currentPos
		    setUpNode = null;
		
		if( setUpMatch !== null ) {  // if there's a setUp() method match at the current position
			var openBraceIdx = setUpMatch.index + setUpMatch[ 0 ].length - 1;
			if( this.input.charAt( openBraceIdx ) !== '{' ) {  // just make sure we have the brace
				throw new Error( "Should have found an open brace for the setUp() block. Found '" + this.input.charAt( openBraceIdx ) + "' instead." );
			}
			
			var closeBraceIdx = Parser.findMatchingClosingBrace( this.input, openBraceIdx );
			
			var setUpBody = this.input.substring( openBraceIdx + 1, closeBraceIdx );
			setUpNode = new SetUpNode( setUpBody );
			
			// advance the current position to one char past the end of the _should block
			this.currentPos = closeBraceIdx + 1;
		}
		return setUpNode;
	},
	
	
	/**
	 * Parses a TearDown method at the {@link #currentPos}.
	 * 
	 * @return {node.TearDown} The TearDown node, or `null` if a tearDown() method was not found at the {@link #currentPos}.
	 */
	parseTearDown : function() {
		this.skipWhitespace();
		
		var tearDownMatch = this.getMatch( this.tearDownRe ),  // attempts to match the regex at the currentPos
		    tearDownNode = null;
		
		if( tearDownMatch !== null ) {  // if there's a tearDown() method match at the current position
			var openBraceIdx = tearDownMatch.index + tearDownMatch[ 0 ].length - 1;
			if( this.input.charAt( openBraceIdx ) !== '{' ) {  // just make sure we have the brace
				throw new Error( "Should have found an open brace for the tearDown() block. Found '" + this.input.charAt( openBraceIdx ) + "' instead." );
			}
			
			var closeBraceIdx = Parser.findMatchingClosingBrace( this.input, openBraceIdx );
			
			var tearDownBody = this.input.substring( openBraceIdx + 1, closeBraceIdx );
			tearDownNode = new TearDownNode( tearDownBody );
			
			// advance the current position to one char past the end of the _should block
			this.currentPos = closeBraceIdx + 1;
		}
		return tearDownNode;
	},
	
	
	/**
	 * Parses a Test method at the {@link #currentPos}.
	 * 
	 * @return {node.Test} The Test node, or `null` if a test method was not found at the {@link #currentPos}.
	 */
	parseTest : function() {
		this.skipWhitespace();
		
		var testMatch = this.getMatch( this.testRe ),  // attempts to match the regex at the currentPos
		    testNode = null;
		
		if( testMatch !== null ) {  // if there' a test method match at the current position
			var openBraceIdx = testMatch.index + testMatch[ 0 ].length - 1;
			if( this.input.charAt( openBraceIdx ) !== '{' ) {  // just make sure we have the brace
				throw new Error( "Should have found an open brace for the test method. Found '" + this.input.charAt( openBraceIdx ) + "' instead." );
			}
			
			var closeBraceIdx = Parser.findMatchingClosingBrace( this.input, openBraceIdx );
			
			var name = testMatch[ 1 ] || testMatch[ 2 ],
			    testBody = this.input.substring( openBraceIdx + 1, closeBraceIdx );
			testNode = new TestNode( name, testBody );
			
			// advance the current position to one char past the end of the _should block
			this.currentPos = closeBraceIdx + 1;
		}
		return testNode;
	},
	
	
	// ------------------------------------
	
	// Utility Parsing Methods
	
	
	/**
	 * Parses a string literal in the {@link #input} at the {@link #currentPos}. Moves the {@link #currentPos}
	 * to the character after the end quote character if a match is found.
	 * 
	 * @protected
	 * @return {String} The string that was parsed, or null if a string literal did not exist at the {@link #currentPos}.
	 */
	parseStringLiteral : function() {
		var input = this.input,
		    currentPos = this.currentPos,
		    charAtCurrentPos = input.charAt( currentPos );
		
		if( charAtCurrentPos === '"' || charAtCurrentPos === "'" ) {
			var closingQuoteIdx = Parser.findMatchingClosingLiteral( input, currentPos ),
			    str = input.substring( currentPos + 1, closingQuoteIdx );
			
			this.currentPos = closingQuoteIdx + 1;
			return str;
		}
		return null;
	},
	
	
	/**
	 * Parses a boolean literal (`true` or `false`) in the {@link #input} at the {@link #currentPos}. Moves the 
	 * {@link #currentPos} to the character after the end of the literal if a match is found.
	 * 
	 * @protected
	 * @return {Boolean} The boolean literal that was parsed, or null if a boolean literal did not exist at the 
	 *   {@link #currentPos}.
	 */
	parseBooleanLiteral : function() {
		var booleanMatch = this.getMatch( /true|false/g );
		
		if( booleanMatch ) {
			this.currentPos += booleanMatch[ 0 ].length;  // advance the current position
			return ( booleanMatch[ 0 ] === "true" );
		}
		return null;
	},
	
	
	/**
	 * Parses an identifier in the {@link #input} at the {@link currentPos}. Moves the {@link #currentPos}
	 * to the character after the end of the identifier if a match is found.
	 * 
	 * @protected
	 * @return {String} The identifier that was parsed, or null if an identifier did not exist at the {@link #currentPos}.
	 */
	parseIdentifier : function() {
		var identifierMatch = this.getMatch( this.identifierRe );
		
		if( identifierMatch ) {
			this.currentPos += identifierMatch[ 0 ].length;  // advance the current position
			return identifierMatch[ 0 ];
		}
		return null;
	},
	
	
	// ------------------------------------
	
	// Utility Methods
	
	
	/**
	 * Attempts to match a regular expression at the Parser's {@link #currentPos} in the {@link #input}. If the regular 
	 * expression does not match at all, or doesn't match at the {@link #currentPos}, then the method returns `null`.
	 * 
	 * @protected
	 * @param {RegExp} regex The RegExp to match the {@link #input} text at the {@link #currentPos}.
	 * @return {Object} The object returned by RegExp.exec(). See the following URL for properties:
	 *   https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/RegExp/exec#Description
	 */
	getMatch : function( regex ) {
		if( !regex.global )
			throw new Error( "regex provided to getMatch() is not global. Cannot set lastIndex property" );
		
		regex = new RegExp( regex );       // make a copy so we can change the lastIndex
		regex.lastIndex = this.currentPos; // advance the regex to start matching at the currentPos
		
		var match = regex.exec( this.input );
		if( match !== null && match.index === this.currentPos ) {  // match found at the currentPos index
			return match;
		} else {
			return null;  // the regex did not match, or did not match at the currentPos index
		}
	},
	
	
	/**
	 * Takes a peek at the character at the {@link #currentPos}, and returns that character. Does *not* advance 
	 * the {@link #currentPos}.
	 * 
	 * @protected
	 */
	peekChar : function() {
		return this.input.charAt( this.currentPos );
	},
	
	
	/**
	 * Utility method to skip over the whitespace at the {@link #currentPos}. Moves the {@link #currentPos}
	 * to the first non-whitespace character, or the end of the {@link #input} if that is reached first.
	 * 
	 * @protected
	 */
	skipWhitespace : function() {
		var input = this.input,
		    inputLen = input.length,
		    pos = this.currentPos,
		    whitespaceRe = /\s/;
		
		while( whitespaceRe.test( input.charAt( pos ) ) && pos < inputLen ) {
			pos++;
		}
		this.currentPos = pos;
	}
	
} );

module.exports = Parser;