/*global require, describe, it */
var expect = require( 'chai' ).expect,
    CodeNode = require( '../../src/node/Code' );

describe( 'node.Code', function() {
	
	var ConcreteCodeNode = CodeNode.extend( {
		// Implement abstract methods
		accept : function() {}
	} );
	
	
	describe( 'setBody()', function() {
	
		it( "should strip off leading and trailing newlines and carriage returns", function() {
			var input = "\r\n\r\nasdf asdf asdf\r\n\r\n\r\n",
			    codeNode = new ConcreteCodeNode( input );
			
			expect( codeNode.getBody() ).to.equal( "asdf asdf asdf" );
		} );
		
		
		it( "should reduce the indent of all of the code by the leading whitespace of the first line", function() {
			var input = [
				'\t\t\tvar a = 1;',
				'\t\t\tfor( var i = 0; i < 10; i++ ) {',
				'\t\t\t\tvar b = 2;',
				'\t\t\t}'
			].join( "\n" );
			
			var codeNode = new ConcreteCodeNode( input );
			expect( codeNode.getBody() ).to.equal( [
				'var a = 1;',
				'for( var i = 0; i < 10; i++ ) {',
				'\tvar b = 2;',
				'}'
			].join( "\n" ) );
		} );
		
		
		it( "should both strip off newlines and carriage returns, and reduce the indent of leading whitespace", function() {
			var input = [
				'\r\n\r\n\t\t\tvar a = 1;',
				'\t\t\tfor( var i = 0; i < 10; i++ ) {',
				'\t\t\t\tvar b = 2;',
				'\t\t\t}\r\n\r\n\r\n'
			].join( "\n" );
			
			var codeNode = new ConcreteCodeNode( input );
			expect( codeNode.getBody() ).to.equal( [
				'var a = 1;',
				'for( var i = 0; i < 10; i++ ) {',
				'\tvar b = 2;',
				'}'
			].join( "\n" ) );
		} );
		
		
		it( "should remove any initial lines of whitespace before determining the indent level to remove", function() {
			var input = [
				'\t\t\t\t\t\t\t\t',
				'\t\t\tvar a = 1;',
				'\t\t\tfor( var i = 0; i < 10; i++ ) {',
				'\t\t\t\tvar b = 2;',
				'\t\t\t}\r\n\r\n\r\n'
			].join( "\n" );
			
			var codeNode = new ConcreteCodeNode( input );
			expect( codeNode.getBody() ).to.equal( [
				'var a = 1;',
				'for( var i = 0; i < 10; i++ ) {',
				'\tvar b = 2;',
				'}'
			].join( "\n" ) );
		} );
		
	} );
	
} );