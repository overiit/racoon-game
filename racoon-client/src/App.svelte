<script>
	import { onMount } from 'svelte';
	import { init } from './engine/engine';
	let el;
	onMount(() => {
		init(el);
	}); 
  </script>
  
  <canvas bind:this={el} style="cursor"></canvas>