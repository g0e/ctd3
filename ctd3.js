/**
ctd3

Copyright (c) 2014 Masafumi.OSOGOE

This software is released under the MIT License.
http://opensource.org/licenses/mit-license.php
*/

// for JSHint
/* global d3 */
/* exported ctd3 */
/* jshint loopfunc: true */

/* ================================================================== */
/*  ctd3 definition                                                   */
/* ================================================================== */
var ctd3 = function(){
	"use strict";
	
	var ctd3 = {
		version: "0.1.0"
	};
	
	/* ------------------------------------------------------------------ */
	/*  ctd3 globals                                                      */
	/* ------------------------------------------------------------------ */

	ctd3.instances = {};
	ctd3.get_instance = function(t){
		if(typeof t === "string"){
			// by div id
			return ctd3.instances[t];
		}else{
			// by DOM element
			//return ctd3.instances[d3.select(t.farthestViewportElement).attr("id").replace(/^svg_/g,"")];
			return null;
		}
	};
	
	ctd3.options = {};
	
	/* ------------------------------------------------------------------ */
	/*  ctd3.Table                                                        */
	/* ------------------------------------------------------------------ */
	
	/**
	meta options
	- order ... for col sorting
	- sort ... "asc" or "desc" or null for default row sorting
	- label ... tr > th text
	- width ... div width ex:100
	- width2 ... used if auto_resize=true
	- text_format ...  function(value, meta, row) like d3.format("%")
	- html_format ... function(formatted_text, meta, value, row)
	- js_format ... function() called after cell-div creation
	- visualize ... "bar" or "gradation" (in-cell chart)
	- visualize_bar_color ... ex:"lightblue" for visualize="bar" customize
	- visualize_low_color ... ex:"green" for visualize="gradation" customize
	- visualize_high_color ... ex:"red" for visualize="gradation" customize
	- filter_value ... "hoge"
	- filter_type ... "select" or "text" or "number"
	- show_tooltip ... true or false(default)
	*/

	ctd3.Table = function(div_id,dataset){
		this.div_id = div_id;
		this.div = d3.select("#"+this.div_id)
			.style("position","relative"); // for overlay position:absolute
		ctd3.instances[div_id] = this;
		this.initialized = false; // executed init_dataset or not

		// place holder
		this.dataset_manager = {};
		this.tag_table = {};
		this.dataset = {};
		this.meta = [];

		// table options
		this.caption = undefined;
		this.row_cursor = 0;
		this.col_cursor =  0;
		this.table_row_size = 10;
		this.table_col_size = 10;
		this.table_fix_col_size = 0;
		this.show_filter_form = true;
		this.show_footer_info = true;
		this.auto_resize = false;
		this.width = undefined;
		this.col_fix_size = 13;

		this.loader = new ctd3.DatasetLoader(this);
		if(dataset){
			this.init_dataset(dataset);
		}
	};
	ctd3.Table.prototype.init_dataset = function(dataset){
		if(!(this.dataset_manager instanceof ctd3.DatasetManager)){
			this.dataset_manager = new ctd3.DatasetManager(this,this.dataset_manager);
			this.dm = this.dataset_manager; // alias for dataset_manager
		}
		this.dataset = this.dataset_manager.setup_dataset(dataset);
		this.meta = this.dataset_manager.create_default_meta();
		this.col_cursor = this.table_fix_col_size;
		this.initialized = true;
	};
	ctd3.Table.prototype.setup_meta = function(meta){
		this.dataset_manager.setup_meta(meta);
		this.dataset_manager.sort_meta();
	};
	ctd3.Table.prototype.setup_options = function(options){
		ctd3.Util.merge(this,options);
		this.col_cursor = this.table_fix_col_size;
	};
	ctd3.Table.prototype.render = function(cond){
		if(!(this.tag_table instanceof ctd3.Parts.TagTable)){
			this.tag_table = new ctd3.Parts.TagTable(this,this.tag_table);
		}
		if(cond === undefined){ cond = {}; }
		if(!(cond.table_render_only)){
			//this.dataset_manager.sort_meta();
			if(!(cond.skip_filter_dataset)){
				this.dataset_manager.filter_dataset();
			}
			this.dataset_manager.sort_dataset();
			this.dataset_manager.reset_view();
		}
		if(this.auto_resize){
			this.resize_calc();
			var that = this;
			d3.select(window).on("resize."+this.div_id,function(){
				that.resize_calc();
				that.render({ table_render_only:true });
			});

		}
		this.tag_table.render();
	};
	ctd3.Table.prototype.resize_calc = function(){
		this.width = (d3.select("#"+this.div_id)[0][0].clientWidth || this.width);
		var i,w,m,sum_rel=0.0,sum_abs=0;
		for(i=0;i<this.meta.length;i++){
			m = this.meta[i];
			w = m.width2;
			if(!(w)){
				sum_rel += 1.0;
			}else if((""+w).slice(-2) == "px"){
				sum_abs += 1.0 * w.replace("px","");
			}else if((""+w).slice(-1) == "%"){
				sum_rel += 1.0 * w.replace("%","") / 100.0;
			}else{
				sum_rel += w;
			}
		}
		sum_abs += this.col_fix_size*this.meta.length;
		var width_abs = sum_abs, width_rel = this.width - width_abs;
		for(i=0;i<this.meta.length;i++){
			m = this.meta[i];
			w = m.width2;
			if(!(w)){
				m.width = 1.0 / sum_rel * width_rel;
			}else if((""+w).slice(-2) == "px"){
				m.width = 1.0 * w.replace("px","");
			}else if((""+w).slice(-1) == "%"){
				m.width = 1.0 * w.replace("%","") / 100.0 / sum_rel * width_rel;
			}else{
				m.width = 1.0 * w / sum_rel * width_rel;
			}
		}
	};
	ctd3.Table.prototype.destroy = function(){
		d3.select("#"+this.div_id).selectAll("*").remove();
		delete ctd3.instances[this.div_id];
	};

	/* ------------------------------------------------------------------ */
	/*  ctd3.Parts                                                        */
	/* ------------------------------------------------------------------ */
	
	ctd3.Parts = function(table,options){
		this.init(table,options);
	};
	ctd3.Parts.prototype.get_defaults = function(){
		return {}; 
	};
	ctd3.Parts.prototype.init = function(table,options){
		var prop;
		var defaults = this.get_defaults();
		
		this.table = table;
		// copy properties to this
		for(prop in options){
			if(options.hasOwnProperty(prop)){
				this[prop] = options[prop];
			}
		}
		// copy default-properties
		for(prop in defaults){
			if(!this.hasOwnProperty(prop)){
				this[prop] = defaults[prop];
			}
		}
	};
	ctd3.Parts.prototype.render = function(){};
	
	/* ------------------------------------------------------------------ */
	/*  ctd3.Parts.TagTable                                               */
	/* ------------------------------------------------------------------ */

	ctd3.Parts.TagTable = function(){ ctd3.Parts.apply(this,arguments); };
	ctd3.Parts.TagTable.prototype = new ctd3.Parts();
	ctd3.Parts.TagTable.prototype.get_defaults = function(){
		return {};
	};
	ctd3.Parts.TagTable.prototype.render = function(){
		var that = this;
		var table = this.table;
		var dataset = this.table.dataset_manager.ds_view;
		var meta = this.table.dataset_manager.meta_view;
		var dm = this.table.dataset_manager;
		
		/********** initialize **********/
		if(!(this.div)){
			// table
			this.div = this.table.div.attr("class","ctd3")
				.append("div").attr("class","ctd3_tag_table");
			this.tag_table = this.div.append("table");
			
			// caption
			if(table.caption){
				this.tag_table.append("caption").text(table.caption);
			}

			// thead
			this.tag_thead = this.tag_table.append("thead");
			this.tag_thead_tr_label = this.tag_thead.append("tr");
			this.tag_thead_tr_filter = this.tag_thead.append("tr");
			
			// tbody_data
			this.tag_tbody = this.tag_table.append("tbody").attr("class","ctd3_tbody_data");
			
			// tfoot
			this.tag_tfoot = this.tag_table.append("tfoot");
			this.tag_tfoot_div = this.tag_tfoot
				.append("tr")
				.append("th").attr("colspan",meta.length+2)
				.append("div").attr("class","ctd3_tfoot_div");
		}
		
		/********** scroll_up **********/
		if(dm.can_scroll_up()){
			// data join
			var scroll_up = this.tag_table.selectAll(".ctd3_tbody_scroll_up").data([0]);
			// enter
			scroll_up.enter()
				.insert("tbody",".ctd3_tbody_data").attr("class","ctd3_tbody_scroll_up")
				.append("tr")
				.append("td").attr("colspan",table.table_col_size+2)
				.style("cursor","pointer")
				.on("click",function(){
					table.row_cursor -= table.table_row_size;
					dm.reset_view();
					table.render({table_render_only:true});
				})
				.append("div").attr("class","ctd3_scroll_up_div")
				.append("span").html(function(){
					return "&#9650; 前の"+dm.can_scroll_up(table.table_row_size)+"件を表示";
				});
		}else{
			this.tag_table.select(".ctd3_tbody_scroll_up").remove();
		}
		
		/********** scroll_down **********/
		if(dm.can_scroll_down()){
			// data join
			var scroll_down = this.tag_table.selectAll(".ctd3_tbody_scroll_down").data([0]);
			// enter
			scroll_down.enter()
				.insert("tbody","tfoot").attr("class","ctd3_tbody_scroll_down")
				.append("tr")
				.append("td").attr("colspan",table.table_col_size+2)
				.style("cursor","pointer")
				.on("click",function(){
					table.row_cursor += table.table_row_size;
					dm.reset_view();
					table.render({table_render_only:true});
				})
				.append("div").attr("class","ctd3_scroll_down_div")
				.append("span").html(function(){
					return "&#9660; 次の"+dm.can_scroll_down(table.table_row_size)+"件を表示";
				});
		}else{
			this.tag_table.select(".ctd3_tbody_scroll_down").remove();
		}
		
		/********** add meta dummy for scroll_left/right **********/
		if(dataset.length>0){
			if(dm.can_scroll_left()){
				meta.unshift({name:"__scroll_left", __pos:table.table_fix_col_size - 0.5});
			}
			if(dm.can_scroll_right()){
				meta.push({name:"__scroll_right", __pos:meta.length});
			}
		}
		
		/********** thead label **********/
		// data join
		var th = this.tag_thead_tr_label.selectAll("th.ctd3_th_label").data(meta,function(d){ return d.name; });
		
		// enter
		th.enter().append("th")
			.each(function(d){
				d3.select(this)
					.attr("class",function(d){ return "ctd3_th_label ctd3_th_"+d.name; })
					.attr("style","cursor:pointer;")
					.on("click",function(meta){
						var dm = that.table.dataset_manager;
						var metas = dm.meta;

						if(meta.sort == "asc"){
							meta.sort = undefined;
						}else if(meta.sort == "desc"){
							meta.sort = "asc";
						}else{
							meta.sort = "desc";
						}
						for(var i=0;i<metas.length;i++){
							if(metas[i].name !== meta.name){
								metas[i].sort = null;
							}
						}
						table.row_cursor = 0;
						that.table.render({skip_filter_dataset:true});
					})
					.append("div")
					.attr("class",function(){
						return (d.name.substring(0,2) == "__")? null:"ctd3_cell_div";
					})
					;
			});
		
		// update
		th.each(function(d){
			d3.select(this).select("div")
				.style("width",function(d,j){
					return (d.width)? d.width+"px" : null;
				})
				.html(function(){
					if(d.name.substring(0,2) == "__"){
						return "";
					}
					var html = (d.label !== undefined)? d.label : d.name;
					if(d.sort == "asc"){
						html += "<span style='font-size:x-small;'>&#9650;</span>";
					}else if(d.sort == "desc"){
						html += "<span style='font-size:x-small;'>&#9660;</span>";
					}
					return html;
				});
			
		});
		th.sort(function(a,b){ return a.__pos - b.__pos; });
		
		// exit
		th.exit().remove();
		
		/********** thead filter **********/
		if(this.table.show_filter_form){
			// data join
			th = this.tag_thead_tr_filter.selectAll("th.ctd3_th_filter").data(meta,function(d){ return d.name; });
			
			// enter
			th.enter().append("th")
				.each(function(d){
					var td = d3.select(this);
					var div = td.attr("class",function(d){ return "ctd3_th_filter ctd3_th_"+d.name; })
						.append("div")
						.attr("class",function(){
							return (d.name.substring(0,2) == "__")? null:"ctd3_cell_div";
						})
						.style("width",function(d,j){
							return (d.width)? d.width+"px" : null;
						});
					that.create_filter_form(div, d);
				});
			
			// update
			th.each(function(d){
				d3.select(this).select("div")
					.style("width",function(d,j){
						return (d.width)? d.width+"px" : null;
					});	
			});
			th.sort(function(a,b){ return a.__pos - b.__pos; });
			
			// exit
			th.exit().remove();
		}
	
		/********** scroll_right/left **********/
		var tr_scroll = this.tag_tbody.select("tr.ctd3_tr_scroll");
		var td_scroll;
		if(dm.can_scroll_right() || dm.can_scroll_left()){
			if(!(tr_scroll[0][0])){
				tr_scroll = this.tag_tbody.append("tr").attr("class","ctd3_tr_scroll");
			}
			
			// data join
			td_scroll = tr_scroll.selectAll("td.ctd3_td_scroll").data(meta,function(d){ return d.name; });
			
			// enter
			td_scroll.enter()
				.append("td")
				.attr("class","ctd3_td_scroll")
				.each(function(m,i){
					td = d3.select(this);
					if(m.name == "__scroll_right"){
						td.attr("rowspan",100)
							.attr("class","ctd3_td_scroll ctd3_td_scroll_right")
							.style("cursor","pointer")
							.on("click",function(){
								table.col_cursor += table.table_col_size - table.table_fix_col_size;
								dm.reset_view();
								table.render({table_render_only:true});
							})
							.append("div").attr("class","ctd3_scroll_right_div")
							.append("span").html("&#9654;");
					}else if(m.name == "__scroll_left"){
						td.attr("rowspan",100)
							.attr("class","ctd3_td_scroll ctd3_td_scroll_left")
							.style("cursor","pointer")
							.on("click",function(){
								table.col_cursor -= table.table_col_size - table.table_fix_col_size;
								dm.reset_view();
								table.render({table_render_only:true});
							})
							.append("div").attr("class","ctd3_scroll_left_div")
							.append("span").html("&#9664;");
					}else{
						td.attr("class","ctd3_td_scroll ctd3_td_empty");
					}
				});
			
			// update
			td_scroll.sort(function(a,b){ return a.__pos - b.__pos; });
			
			// exit
			td_scroll.exit().remove();
		}else{
			if(tr_scroll[0][0]){
				tr_scroll.remove();
			}
		}
		
		/********** delete meta dummy **********/
		if(dataset.length>0){
			if(dm.can_scroll_right()){
				meta.pop();
			}
			if(dm.can_scroll_left()){
				meta.shift();
			}
		}
		
		/********** tbody.tr **********/
		// data join
		var tr = this.tag_tbody.selectAll("tr.ctd3_tr_data").data(dataset,function(d){ return d.__id; });
		
		// enter
		tr.enter()
			.append("tr")
			.attr("class",function(d){ return "ctd3_tr_data ctd3_tr_id_"+d.__id; });
		
		// update
		tr.sort(function(a,b){ return a.__pos - b.__pos; });
		
		// exit
		tr.exit().remove();
		
		
		/********** tbody.tr.td **********/
		var td;
		tr.each(function(row,i){
			// data join
			td = d3.select(this).selectAll("td.ctd3_td_data").data(meta,function(d){ return d.name; });
			
			//enter
			td.enter()
				.append("td")
				.html(function(d,j){
					var html = row[d.name];
					if(meta[j].text_format !== undefined){
						html =  meta[j].text_format(html,meta[j],row);
					}
					if(meta[j].show_tooltip){
						html = "<span class='ctd3_tooltip_span'>" + html + "</span>" + html;
					}
					if(meta[j].html_format !== undefined){
						html = meta[j].html_format(html,meta[j],row[d.name],row);
					}else{
						html = "<div>" + html + "</div>";
					}
					return html;
				})
				.each(function(m,j){
					if(meta[j].js_format !== undefined){
						var d = d3.select(this.parentNode).datum();
						meta[j].js_format.bind(this)(m,d,i,j);
					}
				})
				.attr("class",function(d,j){
					var class_str = (meta[j].css_class)? meta[j].css_class.join(" ") : "";
					return "ctd3_td_data " + ("ctd3_td_"+d.name) + " " + class_str;
				})
				.attr("style",function(d,j){
					if(meta[j].td_style !== undefined){
						return meta[j].td_style(meta[j],row[d.name]);
					}
					return null;
				})
				.select("div").attr("class","ctd3_cell_div")
				;
			
			// update
			td
				.style("width",function(d,j){
					return (meta[j].width)? meta[j].width+"px" : null;
				});
			td.sort(function(a,b){ return a.__pos - b.__pos; });
			
			// exit
			td.exit().remove();
		});
		
		/********** tbody.tr.td for empty dataset **********/
		if(dataset.length === 0){
			if(this.tag_tbody.select("tr.ctd3_tr_empty_dataset")[0][0] === null){
				this.tag_tbody
					.append("tr").attr("class","ctd3_tr_empty_dataset")
					.append("td").attr("colspan",meta.length)
					.append("div").attr("class","ctd3_div_empty_dataset")
						.text("no data found");
			}
		}else{
			this.tag_tbody.select("tr.ctd3_tr_empty_dataset").remove();
		}
		
		/********** tfoot **********/
		this.tag_tfoot_div.select("*").remove();
		if(table.show_footer_info && dataset.length != dm.dataset.length){
			this.tag_tfoot_div
				.attr("style",null)
				.call(function(div){
					div.append("span")
						.text(function(){
							var html = "";
							if(dataset.length > 0){
								html += "" + (table.row_cursor+1) + "-" + (table.row_cursor + dataset.length);
							}else{
								html += "0";
							}
							if(dm.ds_sorted.length != dm.dataset.length){
								html += " / " + dm.ds_sorted.length;
							}else{
								html += " / " + dm.dataset.length;
							}
							return html;
						});
			});
		}else{
			this.tag_tfoot_div.attr("style","height:0.5em");
		}
		this.tag_tfoot.select("th").attr("colspan",meta.length+2);
	};
	ctd3.Parts.TagTable.prototype.create_filter_form = function(div,meta){
		var that = this;
		var table = this.table;
		var dm = this.table.dataset_manager;
		
		if(meta.name.substring(0,2) == "__"){ return; }
		if(meta.filter_type == "text" || meta.filter_type == "number"){
			div.html(function(){
					var value = (meta.filter_value !== undefined)? "value='"+meta.filter_value+"'" : "";
					var html = "<input type='text' name='"+meta.name+"' "+value+" />";
					return html;
				})
				.select("input")
				.on("keyup",function(meta){
					var value = d3.select(this).property("value");
					var dm = that.table.dataset_manager;
					if(value !== ""){
						meta.filter_value = value;
					}else{
						meta.filter_value = undefined;
					}
					table.row_cursor = 0;
					table.render();
				});
		}else if(meta.filter_type == "select"){
			var select = div.append("select");
			select.call(function(){
					select.append("option").attr("value","").text("-");
					if(meta.select_options){
						for(i=0,len=meta.select_options.length;i<len;i++){
							select.append("option").attr("value",meta.select_options[i][1]).text(meta.select_options[i][0])
								.attr("selected",function(){
									return (meta.filter_value == meta.select_options[i][1])? "" : null;
								});
						}
					}else{
						var list = [],i,len;
							for(i=0,len=dm.dataset.length;i<len;i++){
								if(list.indexOf(dm.dataset[i][meta.name]) == -1){
									list.push(dm.dataset[i][meta.name]);
								}
							}
							for(i=0,len=list.length;i<len;i++){
								select.append("option").attr("value",list[i]).text(list[i])
									.attr("selected",function(){
										return (meta.filter_value == list[i])? "" : null;
									});
							}
					}
				})
				.on("change",function(meta){
					var value = d3.select(this).property("value");
					var dm = that.table.dataset_manager;
					if(value !== ""){
						meta.filter_value = value;
					}else{
						meta.filter_value = undefined;
					}
					table.row_cursor = 0;
					table.render();
				});
		}
	};
	
	/* ------------------------------------------------------------------ */
	/*  ctd3.Parts.OverlayLoading                                         */
	/* ------------------------------------------------------------------ */

	ctd3.Parts.OverlayLoading = function(){ ctd3.Parts.apply(this,arguments); };
	ctd3.Parts.OverlayLoading.prototype = new ctd3.Parts();
	ctd3.Parts.OverlayLoading.prototype.get_defaults = function(){
		return {};
	};
	ctd3.Parts.OverlayLoading.prototype.render = function(onoff){
		if(onoff){
			this.div = this.table.div.append("div").attr("class","ctd3_overlay_loading");
			this.div.append("div");
			this.div.append("span").text("Now Loading ... ");
			if(this.table.tag_table.tag_table){
				var h = this.table.tag_table.tag_table[0][0].offsetHeight;
				var w = this.table.tag_table.tag_table[0][0].offsetWidth;
				this.div.select("div").style("width",w+"px").style("height","100%");
				this.div.select("span")
					.style("position","absolute")
					.style("left",function(){
						return (w - this.offsetWidth)/2 + "px";
					})
					.style("top",function(){
						return (h - this.offsetHeight)/2 + "px";
					});
			}
		}else{
			this.table.div.selectAll(".ctd3_overlay_loading").remove();
		}
	};

	/* ------------------------------------------------------------------ */
	/*  ctd3.DatasetManager                                               */
	/* ------------------------------------------------------------------ */
	
	ctd3.DatasetManager = function(table,options){
		this.table = table;
		ctd3.Util.merge(this,this.get_defaults());
		ctd3.Util.merge(this,options);
	};
	ctd3.DatasetManager.prototype.get_defaults = function(){
		return {
			// raw data
			meta: undefined,
			dataset: undefined,
			// processed data
			ds_filtered: undefined,
			ds_sorted: undefined,
			ds_view: undefined,
			meta_view: undefined,
			id_seq: 0,
		};
	};
	ctd3.DatasetManager.prototype.setup_dataset = function(dataset){
		if(dataset){
			this.dataset = ctd3.Util.copy(dataset);
		}
		for(var i=0,len=this.dataset.length;i<len;i++){
			this.dataset[i].__id = i + this.id_seq; // set unique id
		}
		this.id_seq += this.dataset.length;
		return this.dataset;
	};
	ctd3.DatasetManager.prototype.create_default_meta = function(){
		var meta = [];
		var sample = this.dataset[0];
		var text_format,css_class;
		for(var key in sample){
			if(sample.hasOwnProperty(key) && key.substring(0,2) !== "__"){
				css_class = [];
				if(typeof sample[key] == "number"){
					text_format = d3.format(",");
					css_class.push("text_align_right");
				}else{
					text_format = undefined;
				}
				// ignore special data begin width '__'
				meta.push({name:key, text_format:text_format, css_class:css_class, filter_type:"text"});
			}
		}
		this.meta = meta;
		return this.meta;
	};
	ctd3.DatasetManager.prototype.setup_meta = function(meta){
		for(var i=0,len=this.meta.length;i<len;i++){
			if(meta.hasOwnProperty(this.meta[i].name)){
				ctd3.Util.merge(this.meta[i], meta[this.meta[i].name]);
				if(meta[this.meta[i].name].visualize){
					this.enable_incell_visualize(i,meta[this.meta[i].name].visualize);
				}
			}
		}
	};
	ctd3.DatasetManager.prototype.sort_meta = function(){
		this.meta.sort(function(a,b){
			var av = (a.order === undefined)? 999999 : a.order;
			var bv = (b.order === undefined)? 999999 : b.order;
			if(av > bv){ return 1; }
			if(av < bv){ return -1; }
			return 0;
		});
	};
	ctd3.DatasetManager.prototype.enable_incell_visualize = function(pos,type){
		var that = this;
		var extent = d3.extent(this.dataset, function(d){
			return d[that.meta[pos].name]; 
		});
		
		if(type == "bar"){
			this.meta[pos].scale = d3.scale.linear().range([0,100]).domain(extent);
			this.meta[pos].html_format = function(text,meta,val){
				var color = (meta.visualize_bar_color)? meta.visualize_bar_color : "lightblue";
				return "<div style='position:relative;'><div style='background-color:"+color+";position:absolute;z-index:1;height:100%;width:" + meta.scale(val) + "%;'> </div><div style='position:relative;z-index:2;'>" + text + "</div></div>";
			};
		}else if(type == "gradation"){
			var low_color = (this.meta[pos].visualize_low_color)? this.meta[pos].visualize_low_color : "green";
			var high_color = (this.meta[pos].visualize_high_color)? this.meta[pos].visualize_high_color : "red";
			this.meta[pos].scale = d3.scale.linear().range([low_color,high_color]).domain(extent)
				.interpolate(d3.interpolateHsl);
			this.meta[pos].html_format = function(text,meta,val){
				return "<div>" + text + "</div>";
			};
			this.meta[pos].td_style = function(meta,val){
				return "background-color:" + meta.scale(val) + ";";
			};

		}
	};
	ctd3.DatasetManager.prototype.filter_dataset = function(){
		var cond = [],i,j,meta;
		for(i=0;i<this.meta.length;i++){
			if(this.meta[i].filter_value !== undefined){
				meta = this.meta[i];
				if((meta.filter_type == "text" || meta.filter_type == "number") && meta.filter_value !== undefined){
					cond.push(function(d){
						var values = this.filter_value.split(" ");
						var data = (d["__forsearch_"+this.name])? d["__forsearch_"+this.name]:d[this.name];
						if(typeof(data) === "object" && data.__search_value){
							data = data.__search_value;
						}
						if(meta.filter_func){
							data = meta.filter_func(data,meta,d);
						}
						for(var j=0;j<values.length;j++){
							if(values[j].indexOf("<=") === 0 || values[j].indexOf("=<") === 0){
								if(1.0*data > 1.0*values[j].replace("<","").replace("=","")){ return false; }
							}else if(values[j].indexOf(">=") === 0 || values[j].indexOf("=>") === 0){
								if(1.0*data < 1.0*values[j].replace(">","").replace("=","")){ return false; }
							}else if(values[j].indexOf("<") === 0){
								if(1.0*data >= 1.0*values[j].replace("<","")){ return false; }
							}else if(values[j].indexOf(">") === 0){
								if(1.0*data <= 1.0*values[j].replace(">","")){ return false; }
							}else if(values[j].indexOf("=") === 0 || meta.filter_type == "number"){
								if(""+data !== values[j].replace("=","")){ return false; }
							}else{
								if((""+data).indexOf(""+values[j]) == -1){ return false; }
							}
						}
						return true;
					}.bind(meta));
				}else if(meta.filter_type == "select" && meta.filter_value !== undefined){
					cond.push(function(d){
						var data = d[this.name];
						if(typeof(data) === "object" && data.__search_value){
							data = data.__search_value;
						}
						return (""+data == ""+this.filter_value);
					}.bind(meta));

				}
			}
		}
		
		this.ds_filtered = [];
		each_data:
		for(i=0;i<this.dataset.length;i++){
			for(j=0;j<cond.length;j++){
				if(!(cond[j](this.dataset[i]))){
					continue each_data;
				}
			}
			this.ds_filtered.push(this.dataset[i]);
		}
		return this.ds_filtered;
	};
	ctd3.DatasetManager.prototype.sort_dataset = function(){
		var i,j,cond = [];
		this.ds_sorted = [];
		for(i=0;i<this.ds_filtered.length;i++){
			this.ds_sorted.push(this.ds_filtered[i]);
		}
		for(i=0;i<this.meta.length;i++){
			if(this.meta[i].sort == "asc"){
				cond.push(function(a,b){
					var av = a[this.name];
					var bv = b[this.name];
					if(av > bv){ return 1; }
					if(av < bv){ return -1; }
					return 0;
				}.bind(this.meta[i]));
			}else if(this.meta[i].sort == "desc"){
					cond.push(function(a,b){
					var av = a[this.name];
					var bv = b[this.name];
					if(av > bv){ return -1; }
					if(av < bv){ return 1; }
					return 0;
				}.bind(this.meta[i]));
			}
		}
		for(i=0;i<cond.length;i++){
			this.ds_sorted.sort(cond[i]);
		}
		return this.ds_sorted;
	};
	ctd3.DatasetManager.prototype.reset_view = function(){
		var i;
		var table = this.table;
		this.ds_view = [];

		for(i=0;i<table.table_row_size;i++){
			if(i+table.row_cursor < this.ds_sorted.length){
				this.ds_view.push(this.ds_sorted[i+table.row_cursor]);
			}else{
				break;
			}
		}
		this.refresh_ds_view_pos();
		
		this.meta_view = [];
		for(i=0;i<table.table_fix_col_size;i++){
			this.meta_view.push(this.meta[i]);
		}
		for(i=0;i<(table.table_col_size - table.table_fix_col_size);i++){
			if(i+this.table.col_cursor < this.meta.length){
				this.meta_view.push(this.meta[i+this.table.col_cursor]);
			}
		}
		this.refresh_meta_view_pos();
	};
	ctd3.DatasetManager.prototype.can_scroll_up = function(page_size){
		if(page_size === undefined){
			return (this.table.row_cursor > 0)? true : false;
		}else{
			return Math.min(this.table.row_cursor, page_size);
		}
	};
	ctd3.DatasetManager.prototype.can_scroll_down = function(page_size){
		if(page_size === undefined){
			return (this.table.row_cursor + this.ds_view.length < this.ds_sorted.length)? true : false;
		}else{
			return Math.min(this.ds_sorted.length - this.ds_view.length - this.table.row_cursor, page_size);
		}
	};
	ctd3.DatasetManager.prototype.can_scroll_left = function(page_size){
		if(page_size === undefined){
			return (this.table.col_cursor - this.table.table_fix_col_size > 0)? true : false;
		}else{
			return Math.min(this.table.col_cursor - this.table.table_fix_col_size, page_size);
		}
	};
	ctd3.DatasetManager.prototype.can_scroll_right = function(page_size){
		if(page_size === undefined){
			return (this.table.col_cursor + (this.table.table_col_size - this.table.table_fix_col_size) < 
					this.meta.length)? true : false;
		}else{
			return Math.min(this.meta.length - this.table.col_cursor - (this.table.table_col_size - this.table.table_fix_col_size), page_size);
		}
	};
	ctd3.DatasetManager.prototype.refresh_ds_view_pos = function(){
		for(var i=0,len=this.ds_view.length;i<len;i++){
			this.ds_view[i].__pos = i;
		}
	};
	ctd3.DatasetManager.prototype.refresh_meta_view_pos = function(){
		for(var i=0,len=this.meta_view.length;i<len;i++){
			this.meta_view[i].__pos = i;
		}
	};
	ctd3.DatasetManager.prototype.select = function(where_func,select_func){
		var d=this.dataset, r=[];
		for(var i=0;i<d.length;i++){
			if(where_func(d[i])){
				if(select_func === undefined){
					r.push(d[i]);
				}else{
					r.push(select_func(d[i]));
				}
			}
		}
		return r;
	};

	/* ------------------------------------------------------------------ */
	/*  ctd3.DatasetLoader                                                */
	/* ------------------------------------------------------------------ */

	ctd3.DatasetLoader = function(table){
		this.table = table;
		this.base_url = undefined;
		this.url_params = {};
		this.onload_options = undefined;
		this.onload_meta = undefined;
		this.dataset_filter = undefined;
		this.after_load_callback = undefined;
	};
	ctd3.DatasetLoader.prototype.xhr_load = function(params){
		if(!(this.table.overlay_loading instanceof ctd3.Parts.OverlayLoading)){
			this.table.overlay_loading = new ctd3.Parts.OverlayLoading(this.table,{});
		}
		this.table.overlay_loading.render(true);

		var url = this.setup_url(params,this.base_url);
		d3.json(url,function(dataset){
			//console.log(dataset);
			if(this.dataset_filter){
				dataset = this.dataset_filter.apply(this,[dataset]);
			}
			if(this.table.initialized && this.table.dataset.length > 0){
				this.table.dataset = this.table.dataset_manager.setup_dataset(dataset);
			}else{
				this.table.init_dataset(dataset);
				if(this.onload_meta){
					this.table.setup_meta(this.onload_meta);
				}
				if(this.onload_options){
					this.table.setup_options(this.onload_options);
				}
			}
			this.table.row_cursor = 0;
			this.table.render();
			this.table.overlay_loading.render(false);
			if(this.after_load_callback !== undefined){
				this.after_load_callback(this.table);
			}
		}.bind(this));
	};
	ctd3.DatasetLoader.prototype.setup_url = function(params,url){
		if(!url){ url = this.base_url; }
		params = ctd3.Util.merge(this.url_params, params);
		var params_str = "";
		var urls = url.split("?");
		var base_params_ar,base_params = {},param;
		if(urls[1]){
			base_params_ar = urls[1].split("&");
			for(var i=0;i<base_params_ar.length;i++){
				param = base_params_ar[i].split("=");
				base_params[param[0]] = param[1];
			}
		}
		ctd3.Util.merge(base_params,params);
		for(var key in base_params){
			if(base_params.hasOwnProperty(key) && base_params[key] !== null){
				if(params_str!==""){ params_str += "&"; }
				params_str += key + "=" + base_params[key];
			}
		}
		return urls[0] + "?" + params_str;
	};

	/* ------------------------------------------------------------------ */
	/*  ctd3.Util                                                         */
	/* ------------------------------------------------------------------ */
	ctd3.Util = {};
	/**
	* merge object(overwrite properties)
	* thanks to https://gist.github.com/ww24/2181560
	*/
	ctd3.Util.merge = function(a,b){
		for (var key in b) {
			if (b.hasOwnProperty(key)) {
				a[key] = (key in a) ? 
					((typeof a[key] === "object" && typeof b[key] === "object") ?
						ctd3.Util.merge(a[key], b[key]) : b[key]) : b[key];
			}
		}
		return a;
	};
	ctd3.Util.copy = function(obj){
		// deep copy dataset and so on.
		if (null === obj || undefined === obj || "object" != typeof obj) return obj;
		var copy;
		
		if (obj instanceof Date) {
			copy = new Date();
			copy.setTime(obj.getTime());
			return copy;
		}
		if (obj instanceof Array) {
			copy = [];
			for (var i = 0, len = obj.length; i < len; i++) {
				copy[i] = ctd3.Util.copy(obj[i]);
			}
			return copy;
		}
		if (obj instanceof Object) {
			copy = {};
			for (var attr in obj) {
				if (obj.hasOwnProperty(attr)) copy[attr] = ctd3.Util.copy(obj[attr]);
			}
			return copy;
		}
		
		throw new Error("Unable to copy obj! Its type isn't supported.");
	};


	return ctd3;
}();
