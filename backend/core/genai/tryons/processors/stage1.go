package processors

import (
	"fmt"
)

type StageInput struct {
	Category string
	Prompt   string
	Files    []string
}

type StageOutput struct {
	Artifacts []string
	Notes     string
}

type StageFunc func(in StageInput) (StageOutput, error)

func Stage1(in StageInput) (StageOutput, error) {
	fmt.Println("[tryons:stage1] category:", in.Category, "prompt:", in.Prompt, "files:", len(in.Files))
	return StageOutput{
		Artifacts: in.Files,
		Notes:     "stage1-ok",
	}, nil
}


