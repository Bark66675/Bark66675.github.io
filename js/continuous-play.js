// 强制连续播放，防止任何刷新
class ContinuousPlayer {
  constructor() {
    this.isInitialized = false;
    this.init();
  }

  init() {
    // 等待 APlayer 初始化
    this.waitForAPlayer().then(ap => {
      if (!this.isInitialized) {
        console.log('APlayer 初始化完成，开始连续播放模式');
        this.isInitialized = true;
      }
    });

    // 拦截 pjax 可能的重置行为
    this.interceptPJAX();
  }

  waitForAPlayer() {
    return new Promise((resolve) => {
      const checkAPlayer = () => {
        const meting = document.querySelector('meting-js');
        if (meting && meting.aplayer) {
          resolve(meting.aplayer);
        } else {
          setTimeout(checkAPlayer, 100);
        }
      };
      checkAPlayer();
    });
  }

  interceptPJAX() {
    if (typeof pjax !== 'undefined') {
      // 在 pjax 开始前保存状态
      let beforeNavigateState = null;
      
      document.addEventListener('pjax:send', () => {
        const ap = document.querySelector('meting-js')?.aplayer;
        if (ap) {
          beforeNavigateState = {
            currentTime: ap.audio.currentTime,
            paused: ap.audio.paused,
            currentSong: ap.list.audios[ap.list.index]
          };
        }
      });

      // 在 pjax 完成后确保播放器不被重置
      document.addEventListener('pjax:complete', () => {
        setTimeout(() => {
          const ap = document.querySelector('meting-js')?.aplayer;
          if (ap && beforeNavigateState) {
            // 确保播放器继续播放，不被重置
            const currentSong = ap.list.audios[ap.list.index];
            const previousSong = beforeNavigateState.currentSong;
            
            // 如果歌曲不同，切换回之前的歌曲
            if (currentSong.name !== previousSong.name || 
                currentSong.artist !== previousSong.artist) {
              const targetIndex = ap.list.audios.findIndex(song => 
                song.name === previousSong.name && 
                song.artist === previousSong.artist
              );
              if (targetIndex !== -1) {
                ap.list.switch(targetIndex);
              }
            }
            
            // 恢复播放进度
            setTimeout(() => {
              ap.audio.currentTime = beforeNavigateState.currentTime;
              if (!beforeNavigateState.paused) {
                ap.play().catch(e => console.log('播放被浏览器阻止，这是正常行为'));
              }
            }, 100);
          }
        }, 200);
      });
    }
  }
}

// 初始化连续播放
document.addEventListener('DOMContentLoaded', function() {
  new ContinuousPlayer();
});

// 确保在 pjax 导航后重新初始化
if (typeof pjax !== 'undefined') {
  document.addEventListener('pjax:complete', function() {
    setTimeout(() => new ContinuousPlayer(), 100);
  });
}