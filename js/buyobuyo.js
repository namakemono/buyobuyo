var FPS = 30;
var FIELD_COL_MAX   = 6;
var FIELD_ROW_MAX   = 14;
var CELL_SIZE       = 24;
var FIELD_WIDTH     = 720;
var FIELD_HIGHT     = 480;
// Input Key Value
var INPUT_KEY_LEFT  = 37;
var INPUT_KEY_UP    = 38;
var INPUT_KEY_RIGHT = 39;
var INPUT_KEY_DOWN  = 40;
var INPUT_KEY_Z     = 90; // Z：左回転
var INPUT_KEY_X     = 88; // X: 右回転
// Number of Puyo
var PUYO_TYPE_NUM   = 5; // ぷよぷよの種類
// 
var BLOCK_TYPE_NONE     = 0;
var BLOCK_TYPE_BLUE     = 1; // blue
var BLOCK_TYPE_GREEN    = 2; // green
var BLOCK_TYPE_PURPLE   = 3; // purple
var BLOCK_TYPE_RED      = 4; // red
var BLOCK_TYPE_YELLOW   = 5; // yellow
var BLOCK_TYPE_OJAMA    = 6; // ojama
var BLOCK_TYPE_WALL     = 7; // wall
var _input_keys = {};
// 各ぷよぷよの画像ファイル名
var names = {};
names[BLOCK_TYPE_BLUE]      = "pb";
names[BLOCK_TYPE_GREEN]     = "pg";
names[BLOCK_TYPE_PURPLE]    = "pp";
names[BLOCK_TYPE_RED]       = "pr";
names[BLOCK_TYPE_YELLOW]    = "py";
names[BLOCK_TYPE_OJAMA]     = "po";
names[BLOCK_TYPE_WALL]      = "pw";

// 各ぷよぷよ画像のリスト
var imgs = {};
for ( var key in names ){
  var img = new Image();
  img.src = "img/" + names[key] + ".gif";
  imgs[key] = img;
}

/**
 * 対象となる入力キー(key_code)が押されている状態かどうかを返す．
 * @param {int} key_code
 * @return bool 押されている場合はtrue.
 */
function onPressed(key_code) {
  return _input_keys[key_code];
};

function Matrix(row_size, col_size, default_value) {
  var res = [];
  for ( var r = 0; r < row_size; ++r ) {
    var list = [];
    for ( var c = 0; c < col_size; ++c ) {
      list.push(default_value);
    }
    res.push(list);
  }
  return res;
};

/**
 * ぷよを取り扱うクラス
 */
var Puyo = function(r, c){
  this.r = r;
  this.c = c;
  this.type = Math.floor(Math.random() * PUYO_TYPE_NUM) + 1;
  this.controllable = false; // 着地しているかどうか
  /**
   * ぷよを描画する
   * @param Context ctx
   */
  this.render = function(ctx){
    var w = imgs[this.type].width;
    var h = imgs[this.type].height;
    ctx.save();
    ctx.drawImage(imgs[this.type], 0, 0, w, h, this.c * CELL_SIZE, this.r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
    ctx.restore();
  };
};

var field = Matrix(FIELD_ROW_MAX, FIELD_COL_MAX, BLOCK_TYPE_NONE);
var controllable = true;
$(function() {
    var canvas = document.getElementById("field");
    var ctx = canvas.getContext("2d");
    var frame_count = 0;
    // 落下ぷよの生成
    var puyopuyo = [];
    puyopuyo.push( new Puyo(0, FIELD_COL_MAX / 2) );
    puyopuyo.push( new Puyo(1, FIELD_COL_MAX / 2) );
    var inField = function(tr, tc){
      return ( 0 <= tr && tr < FIELD_ROW_MAX && 0 <= tc && tc < FIELD_COL_MAX );
    };
    /**
     * 対象となるぷよ（座標(tr, tc))が他の物体と衝突しているかどうか
     * @return bool 衝突していればtrue.
     */
    function collision(tr, tc){
      return ( ( inField(tr, tc) && field[tr][tc] != BLOCK_TYPE_NONE ) || !inField(tr, tc) );
    };
    function canMove(){
        for ( var i = 0; i < puyopuyo.length; ++i ){
            var nr = puyopuyo[i].r, nc = puyopuyo[i].c;
            // ぷよの自然落下
            if ( frame_count % 4 == 0 ) ++nr;
            // updating phase
            if ( onPressed(INPUT_KEY_DOWN) ) ++nr;
            if ( onPressed(INPUT_KEY_LEFT) ) --nc;
            if ( onPressed(INPUT_KEY_RIGHT) ) ++nc;
            // update the poyopuyo position
            if ( collision(nr, nc) ) return false;
        }
        // 回転できるかどうか
        if ( onPressed(INPUT_KEY_Z) ){
            for ( var i = 1; i < puyopuyo.length; ++i ){
                var dr = puyopuyo[i].r - puyopuyo[0].r;
                var dc = puyopuyo[i].c - puyopuyo[0].c;
                var nr = puyopuyo[i].r - dr + dc;
                var nc = puyopuyo[i].c - dc - dr;
                if ( collision(nr, nc) ){
                    return false;
                }
            }
        }
        return true;
    };
    function move(){
        if ( frame_count % 3 != 0 ) return;
        for ( var i = 0; i < puyopuyo.length; ++i ){
            var nr = puyopuyo[i].r, nc = puyopuyo[i].c;
            // ぷよの自然落下
            if ( frame_count % 4 == 0 ) ++nr;
            // updating phase
            if ( onPressed(INPUT_KEY_DOWN) ) ++nr;
            if ( onPressed(INPUT_KEY_LEFT) ) --nc;
            if ( onPressed(INPUT_KEY_RIGHT) ) ++nc;
            puyopuyo[i].r = nr;
            puyopuyo[i].c = nc;
        }
        // 回転する
        if ( onPressed(INPUT_KEY_Z) ){
            for ( var i = 1; i < puyopuyo.length; ++i ){
                var dr = puyopuyo[i].r - puyopuyo[0].r;
                var dc = puyopuyo[i].c - puyopuyo[0].c;
                var nr = puyopuyo[i].r - dr + dc;
                var nc = puyopuyo[i].c - dc - dr;
                puyopuyo[i].r = nr;
                puyopuyo[i].c = nc;
            }
        }
    };
    function canDrop(){
        for ( var r = FIELD_ROW_MAX-2; r >= 0; --r ){
            for ( var c = 0; c < FIELD_COL_MAX; ++c ){
                if ( field[r][c] != BLOCK_TYPE_NONE &&
                     field[r+1][c] == BLOCK_TYPE_NONE ){
                    return true;
                }
            }
        }
        return false;
    };
    function drop(){
        for ( var r = FIELD_ROW_MAX-2; r >= 0; --r ){
            for ( var c = 0; c < FIELD_COL_MAX; ++c ){
                if ( field[r][c] != BLOCK_TYPE_NONE &&
                    field[r+1][c] == BLOCK_TYPE_NONE ){
                    field[r+1][c] = field[r][c];
                    field[r][c] = BLOCK_TYPE_NONE;
                }
            }
        }
    };
    /**
     * ぷよが削除されたかどうか。削除されたらtrue.
     * BFS algorithm
     * @return bool 
     */
    var erased = function(){
        var used = Matrix(FIELD_ROW_MAX, FIELD_COL_MAX, false);
        var can = false; // ぷよを消去できるかどうか
        var dr = [1, 0, -1, 0];
        var dc = [0, 1, 0, -1];
        for ( var r = FIELD_ROW_MAX-1; r >= 0; --r ){
            for ( var c = 0; c < FIELD_COL_MAX; ++c ){
                if ( !used[r][c] && field[r][c] != BLOCK_TYPE_NONE ){
                    var type = field[r][c].type;
                    var queue = [{r:r,c:c}];
                    used[r][c] = true;
                    var list = [{r:r,c:c}]; // 連結しているぷよの位置
                    while ( queue.length > 0 ){
                        var pos = queue.pop();
                        var cr = pos.r;
                        var cc = pos.c;
                        for ( var i = 0; i < 4; ++i ){
                            var nr = cr + dr[i];
                            var nc = cc + dc[i];
                            if ( inField(nr,nc) && 
                                !used[nr][nc] &&
                                field[cr][cc] == field[nr][nc]){
                                queue.push({r:nr,c:nc});
                                used[nr][nc] = true;
                                list.push({r:nr,c:nc});
                            }
                        }
                    }
                    if ( list.length >= 4 ){ // 連鎖
                        can = true;
                        for ( var i = 0; i < list.length; ++i ){
                            field[list[i].r][list[i].c] = BLOCK_TYPE_NONE;
                        }
                    }
                }
            }
        }
        return can;
    };
    function update() {
      if ( controllable ){
        if ( canMove() ){
          move();
        }
        // 着地する
        for ( var i = 0; i < puyopuyo.length; ++i ){
          var r = puyopuyo[i].r;
          var c = puyopuyo[i].c;
          if ( (inField(r+1,c) && field[r+1][c] != BLOCK_TYPE_NONE) || r+1 == FIELD_ROW_MAX ){
            controllable = false;
          }
        }
        if ( !controllable ){
          for ( var i = 0; i < puyopuyo.length; ++i ){
            var r = puyopuyo[i].r;
            var c = puyopuyo[i].c;
            field[r][c] = puyopuyo[i].type;
          }
        }
      } else {
        if ( canDrop() ){ // 落下しているぷよが存在
          drop();
        } else if ( !erased() ){ // 消去できるぷよが存在しない場合は次のぷよを落下
          for ( i = 0; i < puyopuyo.length; ++i ){
            puyopuyo[i] = new Puyo(i, FIELD_COL_MAX / 2);
          }
          controllable = true;
        }
      }
      ++frame_count;
    };
    function render() {
      // rendering phase
      ctx.clearRect(0, 0, FIELD_WIDTH, FIELD_HIGHT);
      for ( var i = 0; i < puyopuyo.length; ++i ){
        puyopuyo[i].render(ctx);
      }
      for ( var r = 0; r < FIELD_ROW_MAX; ++r ){
        for ( var c = 0; c < FIELD_COL_MAX; ++c ){
          if ( field[r][c] != BLOCK_TYPE_NONE ){
            var type = field[r][c];
            var w = imgs[type].width;
            var h = imgs[type].height;
            ctx.save();
            ctx.drawImage(imgs[type], 0, 0, w, h, c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            ctx.restore();
          }
        }
      }
    };
    function main() {
      update();
      render();
    };
    window.document.onkeydown = function(event){
      _input_keys[event.keyCode] = true;
    };
    window.document.onkeyup = function(event){
      _input_keys[event.keyCode] = false;
    };
    // set FPS
    setInterval(main, 1000 / FPS);
});
