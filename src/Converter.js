/*global require, module */
/*jshint boss:true */
var Class = require( './Class' ),
    Parser = require( './Parser' ),
    JasmineWriter = require( './JasmineWriter' );

var Converter = Class.extend( Object, {
	
	/**
	 * Performs the full conversion, applying all transformations.
	 * 
	 * @param {String} input The input string to convert. Usually the contents of the file to convert.
	 * @param {String} filePath The path of the file being processed. This is just used for debugging, to show the 
	 *   filename when a parse error occurs.
	 * @return {String} The converted output.
	 */
	convert : function( input, filePath ) {
		var str = input;
		
		// First, convert the JSHint Globals
		str = this.convertJsHintGlobals( str );
		
		// Now parse the tests, and apply transformations
		var parseResult = this.parse( str, filePath ),
		    parseTree = parseResult.getParseTree();
		
		var jasmineWriter = new JasmineWriter( {
			indentLevel: parseResult.getIndentLevel()  // start at the indent level that the outer Suite or TestCase was at
		} );
		var jasmineOutput = jasmineWriter.write( parseTree );
		
		// Replace the section of code in the input that held the Ext.Test suite, with the Jasmine output
		str = str.substring( 0, parseResult.getStartIdx() ) + jasmineOutput + str.substring( parseResult.getEndIdx() + 1 );
		
		return str;
	},
	
	
	/**
	 * Adds JSHint globals for Lo-Dash (which some conversions use - underscore.js should be fine as well) and Jasmine, 
	 * while removing those for Ext.Test and YUI. Modifies an existing globals definition, or adds a new one if missing.
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
			
			// Remove 'Ext', 'Y', and 'tests' globals, and remove Lo-Dash/underscore.js for now, because we'll add it back.
			globalsArr = globalsArr.filter( function( e ) {
				return ( e !== 'Ext' && e !== 'Y' && e !== 'tests' && e !== '_' );
			} );
			
			// Add the Lo-Dash global, and Jasmine 'describe', 'beforeEach', 'afterEach', 'it', and 'expect' globals
			globalsArr = globalsArr.concat( [ '_', 'describe', 'beforeEach', 'afterEach', 'it', 'expect' ] );
			
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
			return "/*global _, describe, beforeEach, afterEach, it, expect */\n" + input;
		}
	},
	
	
	/**
	 * Parses the `input`, and returns a {@link ParseResult} which has the tree of parse {@link node.Node Nodes}.
	 * 
	 * @param {String} input
	 * @param {String} filePath The path of the file being processed. This is just used for debugging, to show the 
	 *   filename when a parse error occurs.
	 * @return {ParseResult}
	 */
	parse : function( input, filePath ) {
		return new Parser( input, filePath ).parse();
	}
	
} );

module.exports = Converter;