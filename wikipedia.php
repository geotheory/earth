<?php
    require 'simple_html_dom_utility.php';
    if(!$_POST['url']) $url = "https://en.m.wikipedia.org/wiki/Sun";
    else $url = $_POST['url'];
    $html = file_get_html($url);
	$html->find('div.header', 0)->outertext = '';
	$html->find('.last-modified-bar', 0)->outertext = '';
	$html->find('#footer', 0)->outertext = '';
	$html->find('#page-actions', 0)->outertext = '';
?>
<div>
    <?php echo $html; ?>
</div>
