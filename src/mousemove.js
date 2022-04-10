addEventListener('message',function(e){
    isInRect(e)
})


function isInRect(event){
    for(let i of event.data.opts.data){
        if(event.data.x>=i.x&&event.data.x<=(i.x+i.width)&&event.data.y>=i.y&&event.data.y<=(i.y+i.height)){
            postMessage({
                data:i,
                x:event.data.x,
                y:event.data.y
            })
            return
        }
    }
    postMessage(false)
}