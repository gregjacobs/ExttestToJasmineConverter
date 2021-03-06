/*global require, module */
/*jshint boss:true, evil:true */
var Class = require( './Class' ),
    ParseResult      = require( './ParseResult' ),
    SuiteNode        = require( './node/Suite' ),
    TestCaseNode     = require( './node/TestCase' ),
    DiTestCaseNode   = require( '../src/node/DiTestCase' ),
    ShouldNode       = require( './node/Should' ),
    SetUpNode        = require( './node/SetUp' ),
    TearDownNode     = require( './node/TearDown' ),
    TestNode         = require( './node/Test' ),
    HelperMethodNode = require( './node/HelperMethod' );


/**
 * @class Parser
 * 
 * Parses the the provided `input` to into a tree of {@link node.Node Nodes} representing the construction
 * of Ext.Test unit tests. The nodes consist of {@link node.Suite Suites}, {@link node.TestCase TestCases},
 * and {@link node.Test Tests}.
 */
var Parser = Class.extend( Object, {
	
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
	 * The regular expression used to find the location of an outer suite.
	 * 
	 * Capturing groups:
	 * 
	 * 1. The whitespace of indent to the outer suite.
	 * 2. The package name for the suite. Example: 'unit.persistence'
	 * 3. The direct instantiation of an `Ext.test.Suite` instance, if there is one. This is used by
	 *    the code to determine what the end sequence looks like. It is possible that the suite was
	 *    defined by just an object literal, in which case this will not match anything and be an
	 *    empty string.
	 * 4. The Suite name.
	 */
	outerSuiteRe : /^([ \t]*)tests\.(.*?)\.add\(\s*(new\s*Ext\.test\.(?:Test)?Suite\(\s*)?\{\s*name\s*:\s*['"](.*?)['"],/gm,
	
	/**
	 * @protected
	 * @property {RegExp} outerTestCaseRe
	 * 
	 * The regular expression used to find the location of an outer test case.
	 * 
	 * Capturing groups:
	 * 
	 * 1. The whitespace of indent to the outer suite.
	 * 2. The package name for the suite. Example: 'unit.persistence'
	 * 3. The Suite name, if it is surrounded in single quotes (empty string if not)
	 * 4. The Suite name, if it is surrounded in double quotes (empty string if not)
	 */
	outerTestCaseRe : /^([ \t]*)tests\.(.*?)\.add\(\s*new\s*Ext\.test\.(?:Test)?Case\(\s*\{\s*name\s*:\s*(?:'((?:\\'|.)*?)'|"((?:\\"|.)*?)"),?/gm,
	
	/**
	 * @protected
	 * @property {RegExp} testCaseRe
	 * 
	 * The regular expression used to match TestCases. This is as opposed to the {@link #outerTestCaseRe outer test case},
	 * where there should only be one.
	 * 
	 * Capturing groups:
	 * 
	 * 1. The TestCase name, if it is surrounded in single quotes (empty string if not)
	 * 2. The TestCase name, if it is surrounded in double quotes (empty string if not)
	 */
	testCaseRe : /\{\s*(?:\/\*[\s\S]*?\*\/)?\s*name\s*:\s*(?:'((?:\\'|.)*?)'|"((?:\\"|.)*?)"),?(?!\s*?ttype)/g,
	
	/**
	 * @protected
	 * @property {RegExp} testCaseInstantiationRe
	 * 
	 * The regular expression used to match TestCases that are direct instantiations of a TestCase subclass.
	 * This is done in some tests.
	 * 
	 * For example:
	 * 
	 *     new ui.formFields.DropdownFieldTest( {
	 *         name : "Dropdown Test"
	 *         
	 *         ...
	 *     } )
	 * 
	 * Capturing groups:
	 * 
	 * 1. The package + name of the constructor function being executed. Ex: `ui.formFields.DropdownFieldTest`.
	 * 2. The TestCase name, if it is surrounded in single quotes (empty string if not)
	 * 3. The TestCase name, if it is surrounded in double quotes (empty string if not)
	 */
	testCaseInstantiationRe : /new (.*?Test)\(\s*\{\s*name\s*:\s*(?:'(.*?)'|"(.*?)"),?/g,
	
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
	 * or has the word "should" in the method name. However, this regular expression accepts any quoted method
	 * names as tests, as some tests don't have the keyword "should" in them by accident.
	 * 
	 * Capturing groups:
	 * 
	 * 1. The Test name if the method name starts with 'test'.
	 * 2. The Test name if the method name was surrounded by single quotes
	 * 3. The Test name if the method name was surrounded by double quotes.
	 */
	testRe : /(?:test_?([A-Za-z_\$]*?)|'(.+?)'|"(.+?)")\s*:\s*function\(\)\s*\{/g,
	
	/**
	 * @protected
	 * @property {RegExp} helperMethodRe
	 * 
	 * The regular expression used to match a helper method within a test case (i.e. a non-test method). 
	 * 
	 * Capturing groups:
	 * 
	 * 1. The method name
	 * 2. The arguments list (simply the text in the parenthesis of the function)
	 */
	helperMethodRe : /([A-Za-z_\$][A-Za-z_\$0-9]*)\s*:\s*function\((.*?)\)\s*\{/g,
	
	/**
	 * @protected
	 * @property {RegExp} identifierRe
	 * 
	 * The regular expression used to match a JavaScript identifier.
	 */
	identifierRe : /[A-Za-z_\$][A-Za-z_\$0-9]*/g,
	
	
	
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
			    currentCharIdx = idx + 2,
			    currentChar,
			    currentSeq;
			
			if( nextCommentChar === '/' ) {
				// single line comment
				while( ( currentChar = input.charAt( currentCharIdx ) ) !== '\n' ) {
					currentCharIdx++;
				}
				return currentCharIdx;
				
			} else {
				// multi-line comment
				while( currentCharIdx < inputStrLen ) {
					currentSeq = input.substr( currentCharIdx, 2 );
					if( currentSeq === '*/' ) {
						return currentCharIdx + 2;
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
	 * @constructor
	 * @param {String} input The input string.
	 * @param {String} filePath The path to the file that it is processing. This is only used in debugging,
	 *   when throwing parse errors.
	 */
	constructor : function( input, filePath ) {
		if( !input ) throw new Error( "`input` required" );
		
		this.input = input;
		this.filePath = filePath;
	},
	
	
	// -----------------------------------
	
	// Main Parsing Methods
	
	
	/**
	 * Runs the parsing routine.
	 * 
	 * @return {ParseResult} A ParseResult object detailing the parse.
	 * @throws {Error} If an outer (wrapping) Suite or TestCase could not be found in the {@link #input}.
	 */
	parse : function() {
		// First, find where we should start by matching the outer suite or outer test case
		var outerSuiteMatch = new RegExp( this.outerSuiteRe ).exec( this.input ),        // note: make a copy of the outerSuiteRe, so multiple uses of the regex (which is on the prototype) between instances are not affected
		    outerTestCaseMatch = new RegExp( this.outerTestCaseRe ).exec( this.input );  // note: make a copy of the outerTestCaseRe, so multiple uses of the regex (which is on the prototype) between instances are not affected
		
		if( !outerSuiteMatch && !outerTestCaseMatch ) {
			throw new Error( "No outer Ext.Test Suite or TestCase found in file " + this.filePath );
		}
		
		var startIdx,
		    outerIndentLevel;
		
		if( outerSuiteMatch ) {
			startIdx = outerSuiteMatch.index;
			outerIndentLevel = this.determineIndentLevel( outerSuiteMatch[ 1 ] );
		} else {
			startIdx = outerTestCaseMatch.index;
			outerIndentLevel = this.determineIndentLevel( outerTestCaseMatch[ 1 ] );
		}
		
		this.currentPos = startIdx;  // advance current position to the start of the outer Suite or TestCase
		var outerNode = ( outerSuiteMatch ) ? this.parseOuterSuite() : this.parseOuterTestCase();  // parse the outer Suite or TestCase
		
		return new ParseResult( {
			parseTree   : outerNode,
			input       : this.input,
			startIdx    : startIdx,
			endIdx      : this.currentPos,   // the current position after parsing
			indentLevel : outerIndentLevel   // the indent level to the outer Suite or TestCase (1 tab == 1 indent, 4 spaces == 1 indent)
		} );
	},
	
	
	/**
	 * Determines the indent level, given a chunk of whitespace. If the indents are tabs, then each tab character is 
	 * counted as one level of indent. If indents are spaces, then every 4 spaces are counted as one level of indent.
	 * 
	 * Ex: 2 tabs = indent level of 2
	 *     8 spaces = indent level of 2
	 *     
	 * @param {String} whitespace The whitespace to determine the indent level for.
	 * @return {Number} The number of indents.
	 */
	determineIndentLevel : function( whitespace ) {
		if( !whitespace ) return 0;
		
		var firstChar = whitespace.charAt( 0 );
		if( firstChar === '\t' ) {
			return whitespace.length;
		} else if( firstChar === ' ' ) {
			return Math.round( whitespace.length / 4 );  // rounding just in case there are 3, or 5, or some odd numbe of spaces... Very easy to do when using spaces for indents...
		} else {
			throw new Error( "Could not determine indent level. The first char of the `whitespace` was not a tab or space." );
		}
	},
	
	
	/**
	 * Parses an outer Suite at the {@link #currentPos}, or returns `null` if a Suite was not matched.
	 * 
	 * @protected
	 * @return {node.Node} The Suite node for the outer suite. However, outer Suites were sometimes used
	 *   as outer {@link node.TestCase TestCases} instead, and in that case, a {@link node.TestCase} will
	 *   be returned.
	 */
	parseOuterSuite : function() {
		var outerSuiteMatch = this.getMatch( this.outerSuiteRe );  // attempts to match the regex at the currentPos
		
		var node = null;
		
		if( !outerSuiteMatch ) {
			return node;
			
		} else {
			this.currentPos = outerSuiteMatch.index + outerSuiteMatch[ 0 ].length;
			
			var suiteName = outerSuiteMatch[ 2 ] + '.' + outerSuiteMatch[ 4 ],  // package name + class name
			    children = this.parseSuiteItems(),
			    isObjLiteralDefinition = !outerSuiteMatch[ 3 ];  // true if an object literal defines the suite, false if it was an instantiation of an Ext.test.Suite (i.e. `new Ext.test.Suite`)  
			this.skipWhitespaceAndComments();
			
			// *** There is a possibility that an outer suite was actually used as a TestCase. If we have no Suite
			// items, attempt to parse it as such. Otherwise, we'll consider it an empty Suite.
			if( !children ) {
				var testCaseItems = null;
				try {
					testCaseItems = this.parseTestCaseItems();  // will throw an error if it didn't find the correct constructs
				} catch( e ) {}  // ignore exception
				
				if( testCaseItems && ( testCaseItems.should || testCaseItems.setUp || testCaseItems.tearDown || testCaseItems.tests.length > 0 ) ) {
					node = new TestCaseNode( 
						suiteName, 
						testCaseItems.should, 
						testCaseItems.setUp, 
						testCaseItems.tearDown, 
						testCaseItems.tests, 
						testCaseItems.helperMethods 
					);
				}
			}
			
			// Don't have a node, from being parsed as a TestCase instead of a Suite, then it must be a Suite
			if( !node ) {
				node = new SuiteNode( suiteName, children || [] );
			}
			
			var endOuterSuiteSeqMatch;
			if( isObjLiteralDefinition ) {
				endOuterSuiteSeqMatch = this.getMatch( /\}\s*\);/g );
				if( !endOuterSuiteSeqMatch ) {
					this.throwParseError( "Expected closing sequnce '} );' for the end of the outer Suite defined by object literal." );
				}
			} else {
				endOuterSuiteSeqMatch = this.getMatch( /\}\s*\)\s*\);/g );
				if( !endOuterSuiteSeqMatch ) {
					this.throwParseError( "Expected closing sequnce '} ) );' for the end of the outer Suite defined by instantiation of `Ext.test.Suite()`." );
				}
			}
			this.currentPos += endOuterSuiteSeqMatch[ 0 ].length;  // advanced past the closing sequence
			
			return node;
		}
	},
	
	
	/**
	 * Parses an outer TestCase at the {@link #currentPos}, or returns `null` if a TestCase was not matched.
	 * 
	 * @protected
	 * @return {node.TestCase} The TestCase node for the outer TestCase.
	 */
	parseOuterTestCase : function() {
		var outerTestCaseMatch = this.getMatch( this.outerTestCaseRe );  // attempts to match the regex at the currentPos
		
		if( !outerTestCaseMatch ) {
			return null;
			
		} else {
			this.currentPos = outerTestCaseMatch.index + outerTestCaseMatch[ 0 ].length;
			
			var testCaseItems = this.parseTestCaseItems(),
			    testCaseName = outerTestCaseMatch[ 2 ] + '.' + ( outerTestCaseMatch[ 3 ] || outerTestCaseMatch[ 4 ] );  // package name + class name
			this.skipWhitespaceAndComments();
			
			var endOuterTestCaseSeqMatch = this.getMatch( /\}\s*\)\s*\);/g );
			if( !endOuterTestCaseSeqMatch ) {
				this.throwParseError( "Expected closing sequnce '} ) );' for the end of the outer TestCase." );
			}
			this.currentPos += endOuterTestCaseSeqMatch[ 0 ].length;  // advanced past the closing sequence
			
			return new TestCaseNode( 
				testCaseName, 
				testCaseItems.should, 
				testCaseItems.setUp, 
				testCaseItems.tearDown, 
				testCaseItems.tests, 
				testCaseItems.helperMethods 
			);
		}
	},
	
	
	/**
	 * Parses an inner Suite at the {@link #currentPos}, or returns `null` if a Suite was not matched.
	 * 
	 * @protected
	 * @return {node.Suite} The Suite node parsed at {@link #currentPos}, or `null` if a Suite was
	 *   not matched.
	 */
	parseSuite : function() {
		this.skipWhitespaceAndComments();
		
		// Note: originally was using a regular expression to try to determine if the entity at the currentPos
		// was a Suite or not, but it had an issue where if the entity was a TestCase *followed* by a Suite, that
		// it would think it was a suite. This was due to trying to match a multi-line comment above the TestCase's
		// name, which for some reason, would match all the way down into the next Suite's `*/` sequence, even though
		// the regular expression was set to be non-greedy. So, this implementation eval's the object literal, and
		// determines that way if it is a nested suite or not.
		
		if( this.peekChar() !== '{' ) {
			return null;
			
		} else {
			var closingBraceIdx = Parser.findMatchingClosingBrace( this.input, this.currentPos ),
			    obj = eval( '(' + this.input.substring( this.currentPos, closingBraceIdx + 1 ) + ')' );  // eval the object literal, so we can simply read its properties
			
			var ttype = obj.ttype;
			if( !ttype || ( ttype.toLowerCase() !== 'suite' && ttype.toLowerCase() !== 'testsuite' ) ) {
				return null;
				
			} else {
				this.currentPos++;  // advance past the '{'
				this.skipWhitespaceAndComments();
				
				
				// Find the 'ttype' property, and advance the currentPos past it
				var ttypeRe = /ttype\s*:\s*['"].*?['"],?/g;
				ttypeRe.lastIndex = this.currentPos;
				
				var match = ttypeRe.exec( this.input );
				this.currentPos = ttypeRe.lastIndex;
				this.skipWhitespaceAndComments();
				
				
				// Parse the suite's items
				var suiteName = obj.name,
				    children = this.parseSuiteItems() || [];  // default to an empty array
				
				this.skipWhitespaceAndComments();
				if( this.peekChar() !== '}' ) {
					this.throwParseError( "Expected closing brace '}' for the end of a Suite." );
				}
				this.currentPos++;  // advanced past the closing brace '}'
				
				return new SuiteNode( suiteName, children );
			}
		}
	},
	
	
	
	/**
	 * Parses an 'items' array at the {@link #currentPos}, or returns `null` if an items array was not matched.
	 * 
	 * @protected
	 * @return {node.Node[]} The nodes parsed in the items array at the {@link #currentPos}, or `null` if an items
	 *   array was not not matched.
	 */
	parseSuiteItems : function() {
		this.skipWhitespaceAndComments();
		
		var itemsRe = /items\s*:\s*\[/g,
		    itemsMatch = this.getMatch( itemsRe );
		
		if( !itemsMatch ) {
			return null;
			
		} else {
			this.currentPos += itemsMatch[ 0 ].length;
			this.skipWhitespaceAndComments();
			
			var items = [];
			while( this.peekChar() !== ']' ) {
				var item = this.parseSuite() || this.parseTestCase();
				if( !item ) {
					this.throwParseError( "Expected a child Suite or TestCase while parsing the items of a Suite." );
				}
				items.push( item );
				
				this.skipWhitespaceAndComments();
				if( this.peekChar() === ',' ) {
					this.currentPos++;  // advanced past the comma, if there is one
				}
				this.skipWhitespaceAndComments();
			}
			
			if( this.peekChar() !== ']' ) {
				this.throwParseError( "Expected an ']' to close the suite items" );
			}
			this.currentPos++;  // skip over the ']'
			this.skipWhitespaceAndComments();
			
			return items;
		}
	},
	
	
	/**
	 * Parses a TestCase at the {@link #currentPos}, or returns `null` if a TestCase was not matched.
	 * 
	 * @protected
	 * @return {node.TestCase} The TestCase node parsed at {@link #currentPos}, or `null` if a TestCase was
	 *   not matched.
	 */
	parseTestCase : function() {
		return this.parseAnonymousTestCase() || this.parseDirectInstantiationTestCase();
	},
	
	
	/**
	 * Parses an anonymous TestCase at the {@link #currentPos}, or returns `null` if an anonymous TestCase was 
	 * not matched. An anonymous TestCase is a TestCase defined by an object literal. Ex:
	 * 
	 *     {
	 *         name : "My Test Case",
	 *         
	 *         "something should happen" : function() {
	 *             // ...
	 *         }
	 *     }
	 * 
	 * This is opposed to having a {@link #parseDirectInstantiationTestCase direct instantiation} TestCase.
	 * 
	 * @protected
	 * @return node.TestCase} The TestCase node parsed at {@link #currentPos}, or `null` if a TestCase was
	 *   not matched.
	 */
	parseAnonymousTestCase : function() {
		this.skipWhitespaceAndComments();		
		
		var testCaseMatch = this.getMatch( this.testCaseRe );  // attempts to match the regex at the currentPos
		
		if( !testCaseMatch ) {
			return null;
			
		} else {
			// if there's a TestCase match at the current position
			this.currentPos = testCaseMatch.index + testCaseMatch[ 0 ].length;  // advance the current position
			
			var testCaseName = testCaseMatch[ 1 ] || testCaseMatch[ 2 ],  // depends if the name is surrounded in single or double quotes
			    testCaseItems = this.parseTestCaseItems();
			this.skipWhitespaceAndComments();
			
			if( this.peekChar() !== '}' ) {
				this.throwParseError( "Expected closing brace '}' for the end of an anonymous (object literal) TestCase." );
			}
			this.currentPos++;  // advance past the closing brace '}'
			
			return new TestCaseNode( 
				testCaseName, 
				testCaseItems.should, 
				testCaseItems.setUp, 
				testCaseItems.tearDown, 
				testCaseItems.tests,
				testCaseItems.helperMethods
			);
		}
	},
	
	
	/**
	 * Parses a "direct instantiation" TestCase at the {@link #currentPos}, or returns `null` if a direct instantiation 
	 * TestCase was not matched. A "direct instantiation" TestCase is a TestCase which is the instantiation of an 
	 * ``Ext.test.Case` subclass. Ex:
	 * 
	 *     my.testcase.SubclassTest = Class.extend( Ext.test.Case, {
	 *         ...
	 *     } );
	 *     
	 *     
	 *     // (Inside a test suite)
	 *     new my.testcase.SubclassTest( {
	 *         name : "My Test Case",
	 *         
	 *         "something should happen" : function() {
	 *             // ...
	 *         }
	 *     } )
	 * 
	 * This is opposed to having an {@link #parseAnonymousTestCase anonymous} TestCase.
	 * 
	 * @protected
	 * @return node.TestCase} The TestCase node parsed at {@link #currentPos}, or `null` if a TestCase was
	 *   not matched.
	 */
	parseDirectInstantiationTestCase : function() {
		this.skipWhitespaceAndComments();		
		
		var testCaseMatch = this.getMatch( this.testCaseInstantiationRe );  // attempts to match the regex at the currentPos
		
		if( !testCaseMatch ) {
			return null;
			
		} else {
			// if there's a TestCase match at the current position
			this.currentPos = testCaseMatch.index + testCaseMatch[ 0 ].length;  // advance the current position
			
			var ctorFnName = testCaseMatch[ 1 ],
			    testCaseName = testCaseMatch[ 2 ] || testCaseMatch[ 3 ],  // depends if the name is surrounded in single or double quotes
			    testCaseItems = this.parseTestCaseItems();
			this.skipWhitespaceAndComments();
			
			// Check for the end of the TestCase. We're looking for `} )`
			var endTestCaseMatch = this.getMatch( /\}\s*\)/g );
			if( !endTestCaseMatch ) {
				this.throwParseError( "Expected closing sequence '} )' for the end of a direct instantiation TestCase." );
			}
			this.currentPos += endTestCaseMatch[ 0 ].length;  // advanced past the closing brace '}'
			
			return new DiTestCaseNode( 
				ctorFnName, 
				testCaseName, 
				testCaseItems.should, 
				testCaseItems.setUp, 
				testCaseItems.tearDown, 
				testCaseItems.tests,
				testCaseItems.helperMethods 
			);
		}
	},
	
	
	/**
	 * Parses the items of a TestCase at the {@link #currentPos}.
	 * 
	 * @return {Object} An anonymous object with the following properties:
	 * @return {node.Should} return.should The Should node, if one existed. Will be `null` otherwise.
	 * @return {node.SetUp} return.setUp The SetUp node, if one existed. Will be `null` otherwise.
	 * @return {node.TearDown} return.tearDown The TearDown node, if one existed. Will be `null` otherwise.
	 * @return {node.Test[]} return.tests The Test nodes. Will be an empty array if none existed.
	 */
	parseTestCaseItems : function() {
		this.skipWhitespaceAndComments();
		
		var testCaseItems = {
			should   : null,
			setUp    : null,
			tearDown : null,
			tests    : [],
			helperMethods : []
		};
		
		while( this.peekChar() !== '}' ) {
			var obj = null;
			if( obj = this.parseShould() ) {
				testCaseItems.should = obj;
			} else if( obj = this.parseSetUp() ) {
				testCaseItems.setUp = obj;
			} else if( obj = this.parseTearDown() ) {
				testCaseItems.tearDown = obj;
			} else if( obj = this.parseTest() ) {
				testCaseItems.tests.push( obj );
			} else if( obj = this.parseHelperMethod() ) {
				testCaseItems.helperMethods.push( obj );
			} else if( obj = this.parseEmptyStringPlaceholderMethod() ) {
				// We just ignore this one
				obj = obj;  // just to get JSHint to stop complaining about an empty block
			} else {
				this.throwParseError( "Expected a setUp(), tearDown(), _should block, test method, or helper method, while parsing the items of a TestCase." );
			}
			
			if( this.peekChar() === ',' )
				this.currentPos++;  // advanced past the comma, if there is one
			this.skipWhitespaceAndComments();
		}
		
		return testCaseItems;
	},
	
	
	/**
	 * Parses a "should" block at the {@link #currentPos}.
	 * 
	 * @return {node.Should} The "should" node, or `null` if a "should" block was not found at the {@link #currentPos}.
	 */
	parseShould : function() {
		this.skipWhitespaceAndComments();
		
		var input = this.input,
		    shouldMatch = this.getMatch( this.shouldRe ),  // attempts to match the regex at the currentPos
		    shouldNode = null;
		
		if( shouldMatch !== null ) {  // if there's a "should" block match at the current position
			this.currentPos = shouldMatch.index + shouldMatch[ 0 ].length - 1;  // advance current position to the open brace that starts the _should object
			
			var shouldObj = this.parseObjectLiteral();
			
			this.skipWhitespaceAndComments();
			if( this.peekChar() === ',' )
				this.currentPos++;  // advanced past the comma, if there is one
			
			shouldNode = new ShouldNode( shouldObj.ignore, shouldObj.error );
		}
		return shouldNode;
	},
	
	
	/**
	 * Parses a SetUp method at the {@link #currentPos}.
	 * 
	 * @return {node.SetUp} The SetUp node, or `null` if a setUp() method was not found at the {@link #currentPos}.
	 */
	parseSetUp : function() {
		this.skipWhitespaceAndComments();
		
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
		this.skipWhitespaceAndComments();
		
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
		this.skipWhitespaceAndComments();
		
		var testMatch = this.getMatch( this.testRe ),  // attempts to match the regex at the currentPos
		    testNode = null;
		
		if( testMatch !== null ) {  // if there' a test method match at the current position
			var openBraceIdx = testMatch.index + testMatch[ 0 ].length - 1;
			if( this.input.charAt( openBraceIdx ) !== '{' ) {  // just make sure we have the brace
				throw new Error( "Should have found an open brace for the test method. Found '" + this.input.charAt( openBraceIdx ) + "' instead." );
			}
			
			var closeBraceIdx = Parser.findMatchingClosingBrace( this.input, openBraceIdx );
			
			var name = testMatch[ 1 ] || testMatch[ 2 ] || testMatch[ 3 ],
			    testBody = this.input.substring( openBraceIdx + 1, closeBraceIdx );
			testNode = new TestNode( name, testBody );
			
			// advance the current position to one char past the end of the test method
			this.currentPos = closeBraceIdx + 1;
		}
		return testNode;
	},
	
	
	/**
	 * Parses a helper method method at the {@link #currentPos}. This is a method of a {@link node.TestCase TestCase}
	 * which is not a "test" method, but used as a helper instead.
	 * 
	 * @return {node.HelperMethod} The HelperMethod node, or `null` if a helper method was not found at the 
	 *   {@link #currentPos}.
	 */
	parseHelperMethod : function() {
		this.skipWhitespaceAndComments();
		
		var match = this.getMatch( this.helperMethodRe );  // attempts to match the regex at the currentPos
		
		if( match === null ) {
			return null;
		} else {
			// there's a helper method match at the current position
			var openBraceIdx = match.index + match[ 0 ].length - 1;
			if( this.input.charAt( openBraceIdx ) !== '{' ) {  // just make sure we have the brace
				throw new Error( "Should have found an open brace for the helper method. Found '" + this.input.charAt( openBraceIdx ) + "' instead." );
			}
			
			var closeBraceIdx = Parser.findMatchingClosingBrace( this.input, openBraceIdx );
			
			var name = match[ 1 ],
			    argsList = match[ 2 ],
			    testBody = this.input.substring( openBraceIdx + 1, closeBraceIdx ),
			    helperMethodNode = new HelperMethodNode( name, argsList, testBody );
			
			// advance the current position to one char past the end of the helper method
			this.currentPos = closeBraceIdx + 1;
			
			return helperMethodNode;
		}
	},
	
	
	/**
	 * Parses an "empty string placeholder" method. This was basically when creating a test case but didn't
	 * fill it with anything. Example:
	 * 
	 *     "" : function() {
	 *         
	 *     }
	 * 
	 * This method returns null, but advances the {@link #currentPos} past the empty method.
	 * 
	 * @return {Object} An empty plain JavaScript object if it matched, or null if not.
	 */
	parseEmptyStringPlaceholderMethod : function() {
		this.skipWhitespaceAndComments();
		
		var match = this.getMatch( /['"]['"]\s*:\s*function\(\)\s*\{/g );  // attempts to match the regex at the currentPos
		
		if( match === null ) {
			return null;
		} else {
			// there's an 'empty string placeholder' method match at the current position
			var openBraceIdx = match.index + match[ 0 ].length - 1;
			if( this.input.charAt( openBraceIdx ) !== '{' ) {  // just make sure we have the brace
				throw new Error( "Should have found an open brace for the empty string placeholder method. Found '" + this.input.charAt( openBraceIdx ) + "' instead." );
			}
			
			var closeBraceIdx = Parser.findMatchingClosingBrace( this.input, openBraceIdx );
			
			// advance the current position to one char past the end of the 'empty string placeholder' method
			this.currentPos = closeBraceIdx + 1;
			
			return {};  // just an empty JavaScript object. We'll actually ignore the result of this parse method. It's really just to advance the currentPos
		}
	},
	
	
	/**
	 * Throws an error and gives information about the position of where the parser was looking.
	 * 
	 * @param {String} message
	 * @throws {Error} An Error object detailing where the parse error occurred. Always throws.
	 */
	throwParseError : function( message ) {
		var line = this.input.substring( 0, this.currentPos ).match( /\n/g ).length + 1;  // plus 1 because we start on line 1, not line 0
		throw new Error( [
			"",
			"=========================================================================",
			"A parse error occurred. Message: '" + message + "'",
			"Was looking at text: `" + this.input.substr( this.currentPos, 200 ) + "`",
			"Starting at character " + this.currentPos,
			"On line: " + line + " of file: " + this.filePath,
			"========================================================================="
		].join( '\n' ) );
	},
	
	
	// ------------------------------------
	
	// Utility Parsing Methods
	
	/**
	 * Parses an Object literal. The values must be literals though; no identifiers.
	 * This is mainly just to parse the `_should` objects from TestCases.
	 * 
	 * @return {Object} The Object literal that was parsed. Returns null if an object
	 *  did not start at the {@link #currentPos}.
	 */
	parseObjectLiteral : function() {
		var input = this.input,
		    currentPos = this.currentPos;
		
		if( this.peekChar() === '{' ) {  // character at the current position is an open brace
			var closingBraceIdx = Parser.findMatchingClosingBrace( input, currentPos ),
			    objLiteralSrc = input.substring( currentPos, closingBraceIdx + 1 ),  // include the end brace with the +1
			    obj = eval( '(' + objLiteralSrc + ')' );
			
			this.currentPos = closingBraceIdx + 1;  // advance the currentPos
			return obj;
		}
		return null;
	},
	
	
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
	 * Utility method used to skip over whitespace *and* comments. Continually tries to skip over whitespace and
	 * comments until the {@link #currentPos} has not moved, and then returns.
	 * 
	 * @protected
	 */
	skipWhitespaceAndComments : function() {
		var startPos;
		do {
			startPos = this.currentPos;
			this.skipWhitespace();
			this.skipComments();
		} while( this.currentPos !== startPos );  // while advancing the currentPos, keep going
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
	},
	
	
	/**
	 * Utility method to skip over JavaScript comments at the {@link #currentPos}. Moves the {@link #currentPos}
	 * to the first character after the comment or comments.
	 * 
	 * @protected
	 */
	skipComments : function() {
		var input = this.input,
		    inputLen = input.length,
		    pos = this.currentPos,
		    commentRe = /\/\/|\/\*/;
		
		while( commentRe.test( input.substr( pos, 2 ) ) && pos < inputLen ) {
			pos = Parser.findMatchingEndComment( input, pos );
		}
		this.currentPos = pos;
	}
} );

module.exports = Parser;