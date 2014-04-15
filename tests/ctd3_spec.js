var seq = 1;
var create_table_simple = function(dataset, meta, options){
	d3.select("#table_div").append("div").attr("id","table"+seq).style("margin","20px");
	var t = new ctd3.Table("table"+seq, dataset);
	t.setup_meta(meta);
	t.setup_options(options);
	t.render();
	seq++;
	return t;
};
var dataset = {
	fruit: [
		{ id:1, name: "apple", price:100, profit: 0.1, color:"red", stock:1000 },
		{ id:2, name: "orrange", price:80, profit: 0.05, color:"orange", stock:2000 },
		{ id:3, name: "banana", price:50, profit: 0.2, color:"yellow", stock:1500 },
		{ id:4, name: "mango", price:300, profit: 0.2, color:"yellow", stock:1000 },
		{ id:5, name: "grape", price:300, profit: 0.15, color:"purple", stock:100 },
		{ id:6, name: "lemon", price:95, profit: 0.1, color:"yellow", stock:2000 },
		{ id:7, name: "strawberry", price:500, profit: 0.3, color:"red", stock:100 },
		{ id:8, name: "blueberry", price:500, profit: 0.3, color:"blue", stock:0 },
		{ id:9, name: "coconut", price:300, profit: 0.2, color:"white", stock:0 },
		{ id:10, name: "melon", price:1000, profit: 0.35, color:"green", stock:50 },
		{ id:11, name: "lime", price:90, profit: 0.1, color:"green", stock:1000 },
		{ id:12, name: "pear", price:150, profit: 0.15, color:"white", stock:300 },
		{ id:13, name: "cherry", price:500, profit: 0.3, color:"red", stock:200 },
		{ id:14, name: "peach", price:250, profit: 0.3, color:"pink", stock:0 },
		{ id:15, name: "pineapple", price:300, profit: 0.25, color:"yellow", stock:100 },
	]
};

describe("create fruit-table", function(){
	var meta,options;
	it("don't throw with defaults.",function(){
		expect(function(){
			create_table_simple(dataset.fruit,{},{});
		}).not.toThrow();
	});
	it("don't throw with various options.",function(){
		expect(function(){
			options = { caption:"show all rows", table_row_size: 100, show_filter_form:false };
			create_table_simple(dataset.fruit,{},options);

			options = { caption:"compact size with pagination", 
				table_row_size: 5, table_col_size:4, table_fix_col_size:2 };
			create_table_simple(dataset.fruit,{},options);
			
			options = { caption:"incell visualization & sorting" };
			meta = { price:{ visualize:"bar", sort:"desc" }, profit:{ visualize:"gradation", visualize_high_color:"white" }, stock:{ visualize:"bar",visualize_bar_color:"orange" } };
			create_table_simple(dataset.fruit,meta,options);
			
			options = { caption:"filter values" };
			meta = { price:{ filter_value:">99 <=500" }, color:{ filter_type:"select" } };
			create_table_simple(dataset.fruit,meta,options);
			
			var ds = ctd3.Util.copy(dataset.fruit);
			for(var i=0;i<ds.length;i++){
				ds[i].memo = "test long field here. hogehoge piyopiyo. foo bar. <span style='red'>red text</span>";
			}
			options = { caption:"tooltip & text_format test" };
			meta = { memo:{ width:200, show_tooltip:true }, profit:{ text_format:d3.format("%"), label:"Profit Rate" } };
			create_table_simple(ds,meta,options);

		}).not.toThrow();
	});

});


