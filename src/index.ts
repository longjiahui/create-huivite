#!/usr/bin/env node

import { program } from 'commander'
import { input } from '@inquirer/prompts'
import { $, execa } from 'execa'
import fs from 'fs-extra'
import path from 'node:path'
import { source } from './source.js'

program.argument('<dir>').action(async (dir) => {
    const toDir = path.resolve(dir)
    const defaultName = path.basename(toDir).split(path.sep).pop()
    const projectName = await input({
        message: 'Project name',
        default: defaultName,
        required: true,
    })

    if (fs.existsSync(toDir)) {
        throw new Error('Directory already exists!')
    }

    await $`mkdir -p ${toDir}`
    await $`cd ${toDir}`

    // 初始化文件
    await source('./base/**/*', './base').copyTo(toDir, {
        'package.json': {
            projectName
        }
    })

    // 进入toDIR cwd
    await execa({
        stdout: 'inherit',
        cwd: toDir,
    })`git init .`
    // 进入toDIR cwd
    await execa({
        stdout: 'inherit',
        cwd: toDir,
    })`pnpm i`
})
program.parse()
