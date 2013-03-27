/*global require, module */
var Class = require( '../Class' );


/**
 * @abstract
 * @class node.Visitor
 * 
 * Visitor class for a {@link node.Node}.
 */
var NodeVisitor = Class.extend( Object, {
	abstractClass : true,
	
	
	/**
	 * Visits a {@link node.Suite Suite} node.
	 * 
	 * @abstract
	 * @param {node.Suite} suiteNode
	 */
	visitSuite : Class.abstractMethod,
	
	/**
	 * Visits a {@link node.TestCase TestCase} node.
	 * 
	 * @abstract
	 * @param {node.TestCase} testCaseNode
	 */
	visitTestCase : Class.abstractMethod,
	
	/**
	 * Visits a {@link node.Should Should} node.
	 * 
	 * @abstract
	 * @param {node.Should} shouldNode
	 */
	visitShould : Class.abstractMethod,
	
	/**
	 * Visits a {@link node.SetUp SetUp} node.
	 * 
	 * @abstract
	 * @param {node.SetUp} setUpNode
	 */
	visitSetUp : Class.abstractMethod,
	
	/**
	 * Visits a {@link node.TearDown TearDown} node.
	 * 
	 * @abstract
	 * @param {node.TearDown} tearDownNode
	 */
	visitTearDown : Class.abstractMethod,
	
	/**
	 * Visits a {@link node.Test Test} node.
	 * 
	 * @abstract
	 * @param {node.Test} testNode
	 */
	visitTest : Class.abstractMethod
	
} );

module.exports = NodeVisitor;