/*global require, module */
var _ = require( 'lodash' ),
    Class = require( './Class' );


/**
 * @class ParseResult
 * 
 * Represents the output of a {@link Parser} {@link Parser#parse parse} execution.
 */
var ParseResult = Class.extend( Object, {
	
	/**
	 * @cfg {node.Node} parseTree (required)
	 * 
	 * The top level Node of the parse tree.
	 */
	
	/**
	 * @cfg {String} input (required)
	 * 
	 * The original input that was parsed.
	 */
	
	/**
	 * @cfg {Number} startIdx (required)
	 * 
	 * The index in the {@link #input} where the outer Ext.Test Suite was found, and parsing was started.
	 */
	
	/**
	 * @cfg {Number} endIdx (required)
	 * 
	 * The index in the {@link #input} where the outer Ext.Test Suite ended, and parsing was completed.
	 */
	
	
	
	/**
	 * @constructor
	 * @param {Object} cfg The configuration options for this class.
	 */
	constructor : function( cfg ) {
		_.assign( this, cfg );
	},
	
	
	/**
	 * Retrieves the parse tree. This is a tree of {@link node.Node Nodes}, which at the top
	 * level will be either a {@link node.Suite Suite} node or a {@link node.TestCase TestCase} node.
	 * 
	 * @return {node.Node}
	 */
	getParseTree : function() {
		return this.parseTree;
	},
	
	
	/**
	 * Retrieves the original input provided to the {@link Parser}.
	 * 
	 * @return {String}
	 */
	getInput : function() {
		return this.input;
	},
	
	
	/**
	 * Retrieves the index in the {@link #input} where the outer Ext.Test Suite was found, and parsing was started.
	 * 
	 * @return {Number}
	 */
	getStartIdx : function() {
		return this.startIdx;
	},
	
	
	/**
	 * Retrieves the index in the {@link #input} where the outer Ext.Test Suite ended, and parsing was completed.
	 * 
	 * @return {Number}
	 */
	getEndIdx : function() {
		return this.endIdx;
	}
	
} );

module.exports = ParseResult;