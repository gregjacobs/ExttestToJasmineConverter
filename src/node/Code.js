/*global require, module */
var AbstractNode = require( './Node' );


/**
 * @abstract
 * @class node.Code
 * @extends node.Node
 * 
 * Represents a node that has a body of code. When the body is set, it is stripped of
 * leading indents, and any leading or trailing newlines.
 */
var CodeNode = AbstractNode.extend( {
	abstractClass : true,
	
	
	/**
	 * @constructor
	 * @param {String} body The body of code in the test.
	 */
	constructor : function( body ) {
		this.setBody( body );
	},
	
	
	/**
	 * Sets the body of Code. Strips off all leading and trailing newlines, and removes the initial indent of all of the
	 * code in the body (leaving the indent of nested lines of code though, such as code inside an `if` statement or `for` loop).
	 * 
	 * @param {String} code
	 */
	setBody : function( code ) {
		// Remove all leading and trailing newlines, and trailing tabs and spaces if any
		code = code.replace( /^[\n\r]*|[\n\r\t ]*$/g, '' );
		
		// Remove any initial line of whitespace. This can happen if there was trailing whitespace after the open brace of the 
		// function for this code body
		code = code.replace( /^[\t ]*\r?\n/, '' );
		
		// Find the indent to the first line of code. This is what we'll remove from the beginning
		// of each line, in order to maintain inner indents.
		var initialIndent = code.match( /^[\t ]*/m )[ 0 ],            // find the initial indent
		    removeIndentRe = new RegExp( "^" + initialIndent, 'gm' ); // create a RegExp to remove the initial indent from all lines
		code = code.replace( removeIndentRe, '' );
		
		this.body = code;
	},
	
	
	/**
	 * Retrieves the body of the test method.
	 * 
	 * @return {String}
	 */
	getBody : function() {
		return this.body;
	}
	
} );

module.exports = CodeNode;