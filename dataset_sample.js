// for JSHint
/* global d3,ctd3 */

var ctd3t = function(){
	"use strict";
	
	var ctd3t = {};
	
	ctd3t.DatasetGenerator = function(cond){
		var default_cond = {
			row_cnt: 10,
			cols: [
				{name: "hoge", data_func: ctd3t.random_int},
				{name: "piyo", data_func: ctd3t.random_str}
			],
			random_ceil: 100.0,
			random_floor: 0.0,
			seq_start: 1.0,
			seq_step: 1.0,
			date_start: new Date(2014,0,1),
			date_seq_step: 1000*60*60*24, // date
			numeric_str_len: 5,
			random_str_len: 8,
			walk_start_ceil: 100.0,
			walk_start_floor: 50.0,
			walk_step: 1
		};
		if(!cond){ cond={}; }
		ctd3.Util.merge(default_cond, cond);
		ctd3.Util.merge(this,default_cond);
	};
	ctd3t.DatasetGenerator.prototype.generate = function(cond){
		if(cond){ ctd3.Util.merge(this,cond); }
		this.dataset = [];
		
		for(var i=0;i<this.row_cnt;i++){
			var row = {}
			for(var j=0;j<this.cols.length;j++){
				var pos = { row_pos:i, col_pos:this.cols[j].name };
				row[this.cols[j].name] = this.cols[j].data_func.call(this,pos);
			}
			this.dataset.push(row);
		}
		
		return this.dataset;
	};
	
	/* ------------------------------------------------------------------ */
	/*  value generator functions                                         */
	/* ------------------------------------------------------------------ */
	/* random_basic */
	ctd3t.random_int = function(){
		return parseInt((this.random_ceil - this.random_floor) * Math.random() + this.random_floor);
	};
	ctd3t.random_float = function(){
		return parseFloat((this.random_ceil - this.random_floor) * Math.random() + this.random_floor);
	};
	ctd3t.random_str = function(){
		var list = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		list = list.split('');
		var str = '';
		for (var i=0;i<this.random_str_len;i++) {
			str += list[Math.floor(Math.random() * list.length)];
		}
		return str;
	};
	
	/* sequence_basic */
	ctd3t.sequence_int = function(pos){
		return parseInt(pos.row_pos*this.seq_step + this.seq_start);
	};
	ctd3t.sequence_float = function(pos){
		return parseFloat(pos.row_pos*this.seq_step + this.seq_start);
	};
	ctd3t.sequence_date = function(pos){
		return new Date(pos.row_pos*this.date_seq_step + this.date_start.getTime());
	};
	ctd3t.sequence_str = function(pos){
		return d3.format("0"+this.numeric_str_len+"d")(pos.row_pos);
				this.dataset[i].values.push(value);
	};
	
	/* matrix */
	ctd3t.matrix_x_int = function(pos){
		return parseInt((pos.row_pos + 1) % Math.pow(this.values_cnt,0.5)) + 1;
	};
	ctd3t.matrix_y_int = function(pos){
		return parseInt((pos.row_pos) / Math.pow(this.values_cnt,0.5)) + 1;
	};
	ctd3t.matrix_x_str = function(pos){
		return d3.format("0"+this.numeric_str_len+"d")(parseInt((pos.row_pos + 1) % Math.pow(this.values_cnt,0.5)));
	};
	ctd3t.matrix_y_str = function(pos){
		return d3.format("0"+this.numeric_str_len+"d")(parseInt((pos.row_pos) / Math.pow(this.values_cnt,0.5)));
	};

	/* random_walk */
	ctd3t.random_walk_int = function(pos){
		if(this.dataset[pos.row_pos]){
			return parseInt(this.dataset[pos.row_pos][pos.col_pos] + ((Math.random() < 0.5)? 1:-1)*this.walk_step );
		}else{
			return parseInt((this.walk_start_ceil - this.walk_start_floor) * Math.random() + this.walk_start_floor);
		}
	};

	return ctd3t;
}();


