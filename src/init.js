class GanttCanvas{
    constructor(htmlEle){
        this.option = {}
        this.ctx = null
        this.w = 0
        this.h = 0
        this.titleHeight = 50
        this.dateStart = ''
        this.dateEnd = ''
        this.maxDays = ''
        this.canvas = null
        this.tooltipsCanvas = {
            canvas:null,
            ctx:null
        }
        this.realCanvas = {
            canvas:null,
            ctx:null
        }

        this.init(htmlEle)
    }

    init(htmlEle){
        if(htmlEle.nodeType===1&&htmlEle.nodeName==='CANVAS'){
            this.ctx = htmlEle.getContext("2d")
            htmlEle.width = document.body.offsetWidth
            this.w = htmlEle.offsetWidth
            this.h = htmlEle.offsetHeight
            this.canvas = htmlEle
            const realCanvas = document.createElement('canvas')
            realCanvas.width = this.w
            realCanvas.height = this.h
            this.realCanvas.canvas = realCanvas
            this.realCanvas.ctx = realCanvas.getContext("2d")
        }else{
            throw new Error('请检查输入的元素类型')
        }
    }
    //计算每个数据项的宽度和起始位置
    computedLength(){
        const {dateStart,dateEnd,maxDays} = this
        for(let i of this.option.data){
            const len = (computedDays(i.start_time,i.end_time)/maxDays)
            let start_position = 0,end_position = 100
            if(i.start_time>dateStart){
                start_position = (computedDays(dateStart,i.start_time)/maxDays)
            }else{
                start_position = (computedDays(i.start_time,dateStart)/maxDays)
            }
            end_position = start_position + len
            i.start_position = start_position
            i.end_position = end_position
            i.len = len
        }
    }

    setOption(option){
        this.option = option
        this.handleStartEndTime()
        this.computedLength()
        this.handTiltle()
        const dataLenth = this.option.data.length
        //计算每个数据项的高度，需要把表头的高度减去，再减去每两个数据项之间的间隙十个像素以及第一个数据项和表头的间距十个像素
        const everyHeight = (this.h-50-(dataLenth+1)*10)/this.option.data.length,start_len = 10
        const {w,h} = this
        const {ctx} = this.realCanvas
        ctx.beginPath();
        ctx.strokeStyle = 'black'
        ctx.strokeRect(0,this.titleHeight+1,w,h-this.titleHeight-1)
        // ctx.stroke()
        ctx.closePath();
        for(let i in this.option.data){
            this.option.data[i].x = this.option.data[i].start_position*w
            this.option.data[i].y = everyHeight*i + this.titleHeight + 10*(i*1+1)//因为i是字符串，所以先转为数字
            this.option.data[i].width = this.option.data[i].len*w
            this.option.data[i].height = everyHeight
            this.drawRect(this.option.data[i])
            // let rect = new zrender.Rect({
            //     shape:{
            //         x:this.option.data[i].start_position*w+5,
            //         y:everyHeight*2*i+start_len,
            //         width:this.option.data[i].len*w-5,
            //         height:everyHeight
            //     },
            //     style: {
            //         fill: 'pink',
            //         // text:data[i].text,
            //         text:'文字',
            //         textFill:'black',
            //         fontSize:12,                 //文字大小
            //         // fontFamily:'',               //字体
            //         fontStyle:'normal',          //字形
            //         fontWeight:'normal',         //加粗
            //         textStroke:'black',         //文字描边
            //         textWidth:1,                 //字体线宽
            //         textHeight:12,               //字体高度
            //         textLineWidth:1,             //字体描边线宽
            //         textLineHeight:14,           //字体行高
            //         textPosition:'left',       //字体位置
            //         // textPadding:[0,0,0,0],       //文字内边距
            //         // transformText:true  
            //     },
            // });
            // group.add(rect)
        }
        // ctx.save()
        this.showTooltips()
        this.ctx.drawImage(this.realCanvas.canvas, 0, 0, this.w, this.h, 0, 0, this.w, this.h)
        // this.zr.add(group);
    }
    //计算最早时间和最晚时间以及验证时间字符串的合法性等
    handleStartEndTime(){
        let start = '',end = '',maxDays = 0
        for(let i of this.option.data){
            if(!is_valid_date(i.start_time)){
                throw new Error('请检查开始时间的日期格式')
            }
            if(!is_valid_date(i.end_time)){
                throw new Error('请检查结束时间的日期格式')
            }
            if(i.start_time>i.end_time){
                throw new Error('某项数据的开始日期大于结束日期，请检查！')
            }
            if(start===''){
                start = i.start_time
            }else{
                start = start<i.start_time?start:i.start_time
            }
            if(end===''){
                end = i.end_time
            }else{
                end = end>i.end_time?end:i.end_time
            }
        }
        if(this.option.data.length!==0){
            //计算出最大日期和最小日期之差，并转化为天数
            maxDays = computedDays(start,end)
        }
        this.dateStart = start
        this.dateEnd = end
        this.maxDays = maxDays
    }

    handTiltle(){
        const startDate = this.dateStart.split('-'),endDate = this.dateEnd.split('-'),titleTextList = [];
        let startYear = startDate[0]*1,startMonth = startDate[1]*1,endYear = endDate[0]*1,endMonth = endDate[1]*1;
        while(endYear!==startYear||endMonth!==startMonth){
            titleTextList.push({
                text:startYear+'-'+startMonth
            })
            startMonth++
            if(startMonth>12){
                startYear++
                startMonth = 1
            }
        }
        titleTextList.push({
            text:startYear+'-'+startMonth
        })
        const width = this.w/titleTextList.length,height = 50
        titleTextList.forEach((item,index)=>{
            item.x = index*width
            item.y = 1
            item.width = width
            item.height = height
            item.textStyle = {
                text:item.text
            }
            if(index===0){
                item.left = true
            }
            if(index===titleTextList.length-1){
                item.right = true
            }
            delete item.text
            this.drawTitle(item)
        })
    }

    drawRect(opts){
        const {ctx} = this.realCanvas


        ctx.beginPath();
        ctx.lineWidth = opts.lineWidth || 1
        ctx.strokeStyle = opts.lineColor || 'black'
        ctx.fillStyle = opts.backgroundColor || 'blue'
        // ctx.moveTo(opts.x,opts.y)
        // ctx.lineTo(opts.x+opts.width,opts.y)
        // ctx.lineTo(opts.x+opts.width,opts.y+opts.height)
        // ctx.lineTo(opts.x,opts.y+opts.height)
        // ctx.lineTo(opts.x,opts.y)
        // ctx.stroke()
        // ctx.fill()
        ctx.fillRect(opts.x,opts.y,opts.width,opts.height)
        ctx.closePath();
        if(opts.textStyle){
            ctx.fillStyle=opts.textStyle.color || 'black'
            const {textWidth,textHeight} = getTextWidth(opts)
            let textX = opts.x + opts.width/2 - textWidth/2,textY = opts.y + opts.height/2 + textHeight/2
            if(opts.textStyle.position==='left'){
                textX = opts.x
                textY = opts.y + opts.height/2 - textHeight/2
            }
            else if(opts.textStyle.position==='right'){
                textX = opts.x + opts.width - textWidth
                textY = opts.y + opts.height/2 - textHeight/2
            }
            
            let font = ''
            if(opts.textStyle.fontSize) font = opts.textStyle.fontSize + 'px'
            else font = '14px'
            if(opts.textStyle.fontStyle) font += ' ' + opts.textStyle.fontStyle
            else font += ' normal'
            if(opts.textStyle.fontFamily) font += ' ' + opts.textStyle.fontFamily
            else font += ' Arial'
            if(opts.textStyle.fontWeight) font += ' ' + opts.textStyle.fontWeight
            else font += ' normal'
            ctx.font = font

            ctx.fillText(opts.textStyle.text,textX,textY);
            ctx.fill();
        }
        // ctx.stroke(); 
    }

    drawTitle(opts){
        const {ctx} = this.realCanvas
        ctx.beginPath();
        ctx.lineWidth = 1
        ctx.strokeStyle = 'black'
        ctx.fillStyle = 'white'
        if(opts.left){
            ctx.moveTo(opts.x+1,opts.y)
            ctx.lineTo(opts.x+opts.width,opts.y)
            ctx.lineTo(opts.x+opts.width,opts.y+opts.height)
            ctx.lineTo(opts.x+1,opts.y+opts.height)
            ctx.lineTo(opts.x+1,opts.y)
            ctx.stroke()
            // ctx.fill()
        }else if(opts.right){
            ctx.moveTo(opts.x,opts.y)
            ctx.lineTo(opts.x+opts.width-1,opts.y)
            ctx.lineTo(opts.x+opts.width-1,opts.y+opts.height)
            ctx.lineTo(opts.x,opts.y+opts.height)
            ctx.stroke()
            // ctx.fill()
        }else{
            ctx.moveTo(opts.x+1,opts.y)
            ctx.lineTo(opts.x+opts.width,opts.y)
            ctx.lineTo(opts.x+opts.width,opts.y+opts.height)
            ctx.lineTo(opts.x+1,opts.y+opts.height)
            ctx.stroke()
            // ctx.fill()
        }
        ctx.closePath();
        if(opts.textStyle){
            ctx.fillStyle = 'black'
            const {textWidth,textHeight} = getTextWidth(opts)
            let textX = opts.x + opts.width/2 - textWidth/2,textY = opts.y + opts.height/2 + textHeight/2-2
            // console.log(textX)
            // console.log(textY)
            // let font = ''
            // if(opts.textStyle.fontSize) font = opts.textStyle.fontSize + 'px'
            // else font = '14px'
            // if(opts.textStyle.fontStyle) font += ' ' + opts.textStyle.fontStyle
            // else font += ' normal'
            // if(opts.textStyle.fontFamily) font += ' ' + opts.textStyle.fontFamily
            // else font += ' Arial'
            // if(opts.textStyle.fontWeight) font += ' ' + opts.textStyle.fontWeight
            // else font += ' normal'
            ctx.font = '14px Arial'

            ctx.fillText(opts.textStyle.text,textX,textY);
            // ctx.fill();
        }
    }

    showTooltips(){
        if(!this.option.tooltips.enable){
            return
        }
        this.tooltipsCanvas.canvas = document.createElement("canvas");  
        this.tooltipsCanvas.ctx = this.tooltipsCanvas.canvas.getContext("2d");  
        this.tooltipsCanvas.canvas.width = 150;  
        this.tooltipsCanvas.canvas.height = 100;  
        let w = new Worker('./mousemove.js')
        const self = this
        w.onmessage = function(event){
            self.clearTooltips()
            if(event.data===false){
                self.canvas.style.cursor = 'default'
            }else{
                self.canvas.style.cursor = 'pointer'
                self.drawToolTips(event.data)
            }
        }

        this.canvas.addEventListener('mousemove', (event)=>{  
            let x = event.pageX;  
            let y = event.pageY;
            let bbox = event.target.getBoundingClientRect();
            let realX = x - bbox.left,realY = y - bbox.top
            if(realY>=60){
                w.postMessage({opts:self.option,x:realX,y:realY})
            }else{
                self.clearTooltips()
                self.canvas.style.cursor = 'default'
            }
        }, false);  
    }

    drawToolTips(opts){
        const {ctx} = this.tooltipsCanvas
        // ctx.restore();
        const {textWidth,textHeight} = getTextWidth(opts.data)
        this.tooltipsCanvas.canvas.width = textWidth
        this.tooltipsCanvas.canvas.height = textHeight+5
        ctx.save()
        this.tooltipsCanvas.ctx.clearRect(0, 0, this.tooltipsCanvas.canvas.width, this.tooltipsCanvas.canvas.height)
        ctx.lineWidth = 2;  
        // ctx.strokeStyle = 'red';  
        // ctx.fillStyle="RGBA(255,255,255,0.7)";  
        // // m_context.strokeRect(2, 2, this.tooltipsCanvas.canvas.width-4, this.tooltipsCanvas.canvas.height-4);  
        // // m_context.fillRect(2,2,this.tooltipsCanvas.canvas.width-4, this.tooltipsCanvas.canvas.height-4);  
        // ctx.roundRect(2,2,this.tooltipsCanvas.canvas.width-4, this.tooltipsCanvas.canvas.height-4, 5, true, true);  
        ctx.font="14px Arial";  
        ctx.fillStyle="RGBA(0,0,0,1)";  
        ctx.fillText(opts.data.textStyle.text , 0, textHeight);  
        // ctx.fillText(this.series[index].name + ": " + this.series[index].value + this.unit, 5, 40);  
        // ctx.fillText(this.series[index].precent, 5, 60);  
        ctx.restore()
        if(opts.x + textWidth+10>=this.canvas.width){
            this.ctx.drawImage(this.tooltipsCanvas.canvas, 0, 0, this.tooltipsCanvas.canvas.width, this.tooltipsCanvas.canvas.height,   
                opts.x-this.tooltipsCanvas.canvas.width, opts.y-20, this.tooltipsCanvas.canvas.width, this.tooltipsCanvas.canvas.height);
        }else{
            this.ctx.drawImage(this.tooltipsCanvas.canvas, 0, 0, this.tooltipsCanvas.canvas.width, this.tooltipsCanvas.canvas.height,   
                opts.x+10, opts.y-20, this.tooltipsCanvas.canvas.width, this.tooltipsCanvas.canvas.height);
        }
        
        
    }

    clearTooltips(){  
        this.ctx.clearRect(0,0,this.w, this.h)
        this.tooltipsCanvas.ctx.clearRect(0, 0, this.tooltipsCanvas.canvas.width, this.tooltipsCanvas.canvas.height)
        this.ctx.drawImage(this.realCanvas.canvas, 0, 0, this.w, this.h, 0, 0, this.w, this.h)  
    }

}

let ganttCanvas = new GanttCanvas(document.getElementById('zrender'))
let option = {
    data:[
        {
            start_time:'2021-01-01',
            end_time:'2022-10-10',
            textStyle:{
                text:'11111111111111111111',
                color:'green'
            }
        },
        {
            start_time:'2021-06-01',
            end_time:'2022-10-10',
            textStyle:{
                text:'数据二',
                color:'pink'
            }
        },
        {
            start_time:'2021-10-15',
            end_time:'2022-03-20',
            textStyle:{
                text:'数据三',
            }
        },
        {
            start_time:'2022-05-25',
            end_time:'2022-08-25',
            textStyle:{
                text:'数据四',
            }
        },
        {
            start_time:'2021-03-15',
            end_time:'2021-10-30',
            textStyle:{
                text:'数据五',
            }
        },
        // {
        //     start_time:'2021-03-25',
        //     end_time:'2022-12-31',
        //     text:'数据六',
        // },
    ],
    tooltips:{
        enable:true
    }
}
ganttCanvas.setOption(option)



function is_valid_date(str){
    const reg = /^((\d{2}(([02468][048])|([13579][26]))[\-\/\s]?((((0?[13578])|(1[02]))[\-\/\s]?((0?[1-9])|([1-2][0-9])|(3[01])))|(((0?[469])|(11))[\-\/\s]?((0?[1-9])|([1-2][0-9])|(30)))|(0?2[\-\/\s]?((0?[1-9])|([1-2][0-9])))))|(\d{2}(([02468][1235679])|([13579][01345789]))[\-\/\s]?((((0?[13578])|(1[02]))[\-\/\s]?((0?[1-9])|([1-2][0-9])|(3[01])))|(((0?[469])|(11))[\-\/\s]?((0?[1-9])|([1-2][0-9])|(30)))|(0?2[\-\/\s]?((0?[1-9])|(1[0-9])|(2[0-8]))))))(\s((([0-1][0-9])|(2?[0-3]))\:([0-5]?[0-9])((\s)|(\:([0-5]?[0-9])))))?$/;
    return reg.test(str);
}

function computedDays(start,end){
    let maxDays = new Date(end) - new Date(start)
    maxDays = maxDays/86400000
    return maxDays
}
//计算字符串占据的宽度
function getTextWidth(opts) {
  const dom = document.createElement('span');
//   dom.style.display = 'inline-block';
  dom.style.fontSize = (opts.textStyle.fontSize || 14) + 'px'
  dom.style.fontFamily = opts.textStyle.fontFamily || 'Arial'
  dom.textContent = opts.textStyle.text
  document.body.appendChild(dom);
  const textWidth = dom.offsetWidth
  const textHeight = dom.offsetHeight
  document.body.removeChild(dom);
  return {textWidth,textHeight}
}