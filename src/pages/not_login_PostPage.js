
import {getGlobalPostSuggestNormalized} from '../service/recommendPostsService.js'
import {renderPostCardWithLoading} from '../ui_controll/renderPostCard.js'
let recommendedPost=[];
let loaded_posts_amount=0;
let loadMorePosts_Lock=false;
const postsContainer = document.getElementById('postsContainer');
const postsSection = document.getElementById('postsSection');
postsSection.addEventListener('scroll', function () {
  // 判斷滑到底
  if (
    postsSection.scrollTop + postsSection.clientHeight >= postsSection.scrollHeight - 1
  ) {
    loadMorePosts(); // 這是你要觸發的函式
  }
});

async function loadMorePosts() {
  // 你想要執行的事情（例如加載更多貼文）
  //console.log('滑到底了！');
  if(loadMorePosts_Lock){
        return;
  }
  loadMorePosts_Lock=true;

  if(loaded_posts_amount>recommendedPost.length-1){
	const toappend=await getGlobalPostSuggestNormalized();
  	console.log("recommendpost: ",toappend);
  	recommendedPost=[...recommendedPost,...toappend];
  }
  
  if(loaded_posts_amount<recommendedPost.length){
    renderPostCardWithLoading(recommendedPost[loaded_posts_amount],postsContainer);
    loaded_posts_amount+=1;
    loadMorePosts_Lock=false;
    
  }else{
    loadMorePosts_Lock=false;
    return;
  }

}

export async function initialize(){
  for (let i=0;i<5;i++){

        await loadMorePosts();

  }
}



